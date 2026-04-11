import type { FastifyInstance } from 'fastify';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { organizations, subscriptions, users } from '../db/schema.js';
import { authGuard, adminGuard } from '../middleware/auth.js';
import { env } from '../env.js';
import {
  createSubscription,
  getSubscription,
  cancelSubscription,
  verifyWebhookSignature,
} from '../lib/paypal.js';

// Plan config — you can later move this to DB or PayPal dashboard
const PLANS = {
  pro: {
    paypalPlanId: process.env.PAYPAL_PRO_PLAN_ID ?? '',
    name: 'Pro',
    priceUsd: 29,
    seatLimit: 10,
  },
  enterprise: {
    paypalPlanId: process.env.PAYPAL_ENTERPRISE_PLAN_ID ?? '',
    name: 'Enterprise',
    priceUsd: 99,
    seatLimit: 50,
  },
} as const;

export async function billingRoutes(app: FastifyInstance): Promise<void> {
  // ── GET /api/billing — current billing info ────────────────
  app.get(
    '/api/billing',
    { preHandler: [authGuard] },
    async (request) => {
      const { orgId } = request.user;

      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, orgId))
        .limit(1);

      const [sub] = await db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.orgId, orgId),
            eq(subscriptions.status, 'ACTIVE'),
          ),
        )
        .limit(1);

      const seatCount = await db
        .select()
        .from(users)
        .where(eq(users.orgId, orgId))
        .then((rows) => rows.length);

      if (!sub) {
        return {
          plan: 'Free',
          seatCount,
          seatLimit: 3,
          nextBillingDate: null,
          amount: 0,
          currency: 'USD',
          status: 'active',
          paypalSubscriptionId: null,
        };
      }

      // Fetch latest info from PayPal
      let nextBillingDate: string | null = null;
      try {
        const paypalSub = await getSubscription(sub.paypalSubscriptionId);
        nextBillingDate = paypalSub.billing_info?.next_billing_time ?? null;
      } catch {
        // PayPal fetch failed, use local data
      }

      return {
        plan: sub.plan.charAt(0).toUpperCase() + sub.plan.slice(1),
        seatCount,
        seatLimit: sub.seatLimit,
        nextBillingDate: nextBillingDate ?? sub.currentPeriodEnd?.toISOString() ?? null,
        amount: sub.amountCents,
        currency: sub.currency,
        status: sub.status.toLowerCase(),
        paypalSubscriptionId: sub.paypalSubscriptionId,
      };
    },
  );

  // ── GET /api/billing/plans — available plans ───────────────
  app.get(
    '/api/billing/plans',
    { preHandler: [authGuard] },
    async () => {
      return Object.entries(PLANS).map(([key, plan]) => ({
        id: key,
        name: plan.name,
        priceUsd: plan.priceUsd,
        seatLimit: plan.seatLimit,
      }));
    },
  );

  // ── POST /api/billing/subscribe — create PayPal subscription
  app.post<{ Body: { plan: 'pro' | 'enterprise' } }>(
    '/api/billing/subscribe',
    { preHandler: [authGuard, adminGuard] },
    async (request, reply) => {
      const { orgId } = request.user;
      const { plan } = request.body;

      const planConfig = PLANS[plan];
      if (!planConfig || !planConfig.paypalPlanId) {
        return reply.status(400).send({ error: 'Invalid plan or plan not configured' });
      }

      // Check no existing active sub
      const [existingSub] = await db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.orgId, orgId),
            eq(subscriptions.status, 'ACTIVE'),
          ),
        )
        .limit(1);

      if (existingSub) {
        return reply.status(400).send({ error: 'Already have an active subscription. Cancel first to switch plans.' });
      }

      const returnUrl = `${env.APP_URL}/billing?subscription=success`;
      const cancelUrl = `${env.APP_URL}/billing?subscription=canceled`;

      const paypalSub = await createSubscription(planConfig.paypalPlanId, returnUrl, cancelUrl);

      // Save pending subscription
      await db.insert(subscriptions).values({
        orgId,
        paypalSubscriptionId: paypalSub.id,
        paypalPlanId: planConfig.paypalPlanId,
        status: 'PENDING',
        plan,
        seatLimit: planConfig.seatLimit,
        amountCents: planConfig.priceUsd * 100,
        currency: 'USD',
      });

      // Return PayPal approval URL
      const approvalLink = paypalSub.links.find((l) => l.rel === 'approve');
      if (!approvalLink) {
        return reply.status(500).send({ error: 'PayPal did not return approval URL' });
      }

      return { approvalUrl: approvalLink.href, subscriptionId: paypalSub.id };
    },
  );

  // ── POST /api/billing/activate — activate after PayPal approval
  app.post<{ Body: { subscriptionId: string } }>(
    '/api/billing/activate',
    { preHandler: [authGuard, adminGuard] },
    async (request, reply) => {
      const { orgId } = request.user;
      const { subscriptionId } = request.body;

      const paypalSub = await getSubscription(subscriptionId);

      if (paypalSub.status !== 'ACTIVE') {
        return reply.status(400).send({ error: `Subscription is ${paypalSub.status}, not active` });
      }

      // Update local subscription
      const [sub] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.paypalSubscriptionId, subscriptionId))
        .limit(1);

      if (!sub || sub.orgId !== orgId) {
        return reply.status(404).send({ error: 'Subscription not found' });
      }

      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      await db
        .update(subscriptions)
        .set({
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          updatedAt: now,
        })
        .where(eq(subscriptions.id, sub.id));

      // Upgrade org plan
      await db
        .update(organizations)
        .set({
          plan: sub.plan,
          paypalSubscriptionId: subscriptionId,
          updatedAt: now,
        })
        .where(eq(organizations.id, orgId));

      return { status: 'active', plan: sub.plan };
    },
  );

  // ── POST /api/billing/cancel — cancel subscription ─────────
  app.post(
    '/api/billing/cancel',
    { preHandler: [authGuard, adminGuard] },
    async (request, reply) => {
      const { orgId } = request.user;

      const [sub] = await db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.orgId, orgId),
            eq(subscriptions.status, 'ACTIVE'),
          ),
        )
        .limit(1);

      if (!sub) {
        return reply.status(404).send({ error: 'No active subscription' });
      }

      await cancelSubscription(sub.paypalSubscriptionId, 'User requested cancellation');

      const now = new Date();
      await db
        .update(subscriptions)
        .set({
          status: 'CANCELLED',
          canceledAt: now,
          updatedAt: now,
        })
        .where(eq(subscriptions.id, sub.id));

      await db
        .update(organizations)
        .set({ plan: 'free', paypalSubscriptionId: null, updatedAt: now })
        .where(eq(organizations.id, orgId));

      return { status: 'cancelled' };
    },
  );

  // ── POST /api/billing/webhook — PayPal webhook handler ─────
  app.post(
    '/api/billing/webhook',
    { config: { rawBody: true } },
    async (request, reply) => {
      const headers = request.headers as Record<string, string>;
      const rawBody = JSON.stringify(request.body);

      const verified = await verifyWebhookSignature(headers, rawBody);
      if (!verified) {
        return reply.status(400).send({ error: 'Invalid webhook signature' });
      }

      const event = request.body as {
        event_type: string;
        resource: { id: string; status: string; billing_info?: { next_billing_time?: string } };
      };

      const subId = event.resource.id;
      const now = new Date();

      switch (event.event_type) {
        case 'BILLING.SUBSCRIPTION.ACTIVATED': {
          const periodEnd = new Date(now);
          periodEnd.setMonth(periodEnd.getMonth() + 1);

          await db
            .update(subscriptions)
            .set({
              status: 'ACTIVE',
              currentPeriodStart: now,
              currentPeriodEnd: periodEnd,
              updatedAt: now,
            })
            .where(eq(subscriptions.paypalSubscriptionId, subId));

          // Also upgrade org
          const [sub] = await db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.paypalSubscriptionId, subId))
            .limit(1);

          if (sub) {
            await db
              .update(organizations)
              .set({ plan: sub.plan, paypalSubscriptionId: subId, updatedAt: now })
              .where(eq(organizations.id, sub.orgId));
          }
          break;
        }

        case 'BILLING.SUBSCRIPTION.CANCELLED':
        case 'BILLING.SUBSCRIPTION.EXPIRED': {
          await db
            .update(subscriptions)
            .set({ status: 'CANCELLED', canceledAt: now, updatedAt: now })
            .where(eq(subscriptions.paypalSubscriptionId, subId));

          const [sub] = await db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.paypalSubscriptionId, subId))
            .limit(1);

          if (sub) {
            await db
              .update(organizations)
              .set({ plan: 'free', paypalSubscriptionId: null, updatedAt: now })
              .where(eq(organizations.id, sub.orgId));
          }
          break;
        }

        case 'BILLING.SUBSCRIPTION.SUSPENDED': {
          await db
            .update(subscriptions)
            .set({ status: 'SUSPENDED', updatedAt: now })
            .where(eq(subscriptions.paypalSubscriptionId, subId));
          break;
        }

        case 'PAYMENT.SALE.COMPLETED': {
          // Renewal payment succeeded — extend period
          const [sub] = await db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.paypalSubscriptionId, subId))
            .limit(1);

          if (sub) {
            const newEnd = new Date(sub.currentPeriodEnd ?? now);
            newEnd.setMonth(newEnd.getMonth() + 1);

            await db
              .update(subscriptions)
              .set({
                currentPeriodStart: sub.currentPeriodEnd ?? now,
                currentPeriodEnd: newEnd,
                updatedAt: now,
              })
              .where(eq(subscriptions.id, sub.id));
          }
          break;
        }
      }

      return { received: true };
    },
  );
}
