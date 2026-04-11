/**
 * One-time setup script to create PayPal product + subscription plans.
 *
 * Usage:
 *   PAYPAL_CLIENT_ID=xxx PAYPAL_CLIENT_SECRET=yyy npx tsx scripts/setup-paypal.ts
 *
 * Optional:
 *   PAYPAL_MODE=live   (default: sandbox)
 *
 * Output: prints the plan IDs you need to set as env vars.
 */

const PAYPAL_MODE = (process.env.PAYPAL_MODE ?? 'sandbox') as 'sandbox' | 'live';
const CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

const BASE =
  PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET env vars');
  process.exit(1);
}

async function getToken(): Promise<string> {
  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`Auth failed: ${await res.text()}`);
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

async function paypal<T>(token: string, path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} failed: ${await res.text()}`);
  return res.json() as Promise<T>;
}

async function main() {
  console.log(`\nMode: ${PAYPAL_MODE.toUpperCase()}`);
  console.log('Authenticating...');
  const token = await getToken();

  // 1. Create product
  console.log('Creating product...');
  const product = await paypal<{ id: string }>(token, '/v1/catalogs/products', {
    name: 'DeskPort',
    description: 'CLI tool sharing platform — share terminal access with your team',
    type: 'SERVICE',
    category: 'SOFTWARE',
  });
  console.log(`  Product ID: ${product.id}`);

  // 2. Create Pro plan ($29/mo)
  console.log('Creating Pro plan ($29/mo)...');
  const proPlan = await paypal<{ id: string }>(token, '/v1/billing/plans', {
    product_id: product.id,
    name: 'DeskPort Pro',
    description: 'Up to 10 team members, unlimited sessions, recording, audit logs',
    billing_cycles: [
      {
        frequency: { interval_unit: 'MONTH', interval_count: 1 },
        tenure_type: 'REGULAR',
        sequence: 1,
        total_cycles: 0,
        pricing_scheme: {
          fixed_price: { value: '29', currency_code: 'USD' },
        },
      },
    ],
    payment_preferences: {
      auto_bill_outstanding: true,
      payment_failure_threshold: 3,
    },
  });
  console.log(`  Pro Plan ID: ${proPlan.id}`);

  // 3. Create Enterprise plan ($99/mo)
  console.log('Creating Enterprise plan ($99/mo)...');
  const enterprisePlan = await paypal<{ id: string }>(token, '/v1/billing/plans', {
    product_id: product.id,
    name: 'DeskPort Enterprise',
    description: 'Up to 50 team members, SSO, priority support, unlimited everything',
    billing_cycles: [
      {
        frequency: { interval_unit: 'MONTH', interval_count: 1 },
        tenure_type: 'REGULAR',
        sequence: 1,
        total_cycles: 0,
        pricing_scheme: {
          fixed_price: { value: '99', currency_code: 'USD' },
        },
      },
    ],
    payment_preferences: {
      auto_bill_outstanding: true,
      payment_failure_threshold: 3,
    },
  });
  console.log(`  Enterprise Plan ID: ${enterprisePlan.id}`);

  // 4. Print env vars
  console.log('\n══════════════════════════════════════════════');
  console.log('Add these to your .env:');
  console.log('══════════════════════════════════════════════');
  console.log(`PAYPAL_CLIENT_ID=${CLIENT_ID}`);
  console.log(`PAYPAL_CLIENT_SECRET=${CLIENT_SECRET}`);
  console.log(`PAYPAL_MODE=${PAYPAL_MODE}`);
  console.log(`PAYPAL_PRO_PLAN_ID=${proPlan.id}`);
  console.log(`PAYPAL_ENTERPRISE_PLAN_ID=${enterprisePlan.id}`);
  console.log('PAYPAL_WEBHOOK_ID=          # set after creating webhook in dashboard');
  console.log('══════════════════════════════════════════════\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
