import { env } from '../env.js';

const PAYPAL_BASE =
  env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const auth = Buffer.from(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`).toString('base64');

  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PayPal auth failed: ${res.status} ${body}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return cachedToken.token;
}

async function paypalRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();

  const res = await fetch(`${PAYPAL_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PayPal API error: ${res.status} ${body}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ── Plans ──────────────────────────────────────────────────────

export interface PayPalPlan {
  id: string;
  name: string;
  status: string;
  billing_cycles: Array<{
    pricing_scheme: { fixed_price: { value: string; currency_code: string } };
    frequency: { interval_unit: string; interval_count: number };
  }>;
}

export async function createProduct(): Promise<{ id: string }> {
  return paypalRequest('/v1/catalogs/products', {
    method: 'POST',
    body: JSON.stringify({
      name: 'DeskPort',
      description: 'CLI tool sharing platform',
      type: 'SERVICE',
      category: 'SOFTWARE',
    }),
  });
}

export async function createPlan(
  productId: string,
  name: string,
  priceUsd: string,
): Promise<PayPalPlan> {
  return paypalRequest('/v1/billing/plans', {
    method: 'POST',
    body: JSON.stringify({
      product_id: productId,
      name,
      billing_cycles: [
        {
          frequency: { interval_unit: 'MONTH', interval_count: 1 },
          tenure_type: 'REGULAR',
          sequence: 1,
          total_cycles: 0,
          pricing_scheme: {
            fixed_price: { value: priceUsd, currency_code: 'USD' },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        payment_failure_threshold: 3,
      },
    }),
  });
}

// ── Subscriptions ──────────────────────────────────────────────

export interface PayPalSubscription {
  id: string;
  status: string;
  plan_id: string;
  billing_info?: {
    next_billing_time?: string;
    last_payment?: {
      amount: { value: string; currency_code: string };
      time: string;
    };
  };
  create_time: string;
  links: Array<{ rel: string; href: string }>;
}

export async function createSubscription(
  planId: string,
  returnUrl: string,
  cancelUrl: string,
): Promise<PayPalSubscription> {
  return paypalRequest('/v1/billing/subscriptions', {
    method: 'POST',
    body: JSON.stringify({
      plan_id: planId,
      application_context: {
        brand_name: 'DeskPort',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'SUBSCRIBE_NOW',
        return_url: returnUrl,
        cancel_url: cancelUrl,
      },
    }),
  });
}

export async function getSubscription(subscriptionId: string): Promise<PayPalSubscription> {
  return paypalRequest(`/v1/billing/subscriptions/${subscriptionId}`);
}

export async function cancelSubscription(subscriptionId: string, reason: string): Promise<void> {
  return paypalRequest(`/v1/billing/subscriptions/${subscriptionId}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

// ── Webhook verification ───────────────────────────────────────

export async function verifyWebhookSignature(
  headers: Record<string, string>,
  body: string,
): Promise<boolean> {
  if (!env.PAYPAL_WEBHOOK_ID) return true; // skip in dev

  try {
    const res = await paypalRequest<{ verification_status: string }>(
      '/v1/notifications/verify-webhook-signature',
      {
        method: 'POST',
        body: JSON.stringify({
          auth_algo: headers['paypal-auth-algo'],
          cert_url: headers['paypal-cert-url'],
          transmission_id: headers['paypal-transmission-id'],
          transmission_sig: headers['paypal-transmission-sig'],
          transmission_time: headers['paypal-transmission-time'],
          webhook_id: env.PAYPAL_WEBHOOK_ID,
          webhook_event: JSON.parse(body),
        }),
      },
    );
    return res.verification_status === 'SUCCESS';
  } catch {
    return false;
  }
}
