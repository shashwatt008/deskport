"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CreditCard,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/lib/api";

interface BillingInfo {
  plan: string;
  seatCount: number;
  seatLimit: number;
  nextBillingDate: string | null;
  amount: number;
  currency: string;
  status: string;
  paypalSubscriptionId: string | null;
}

interface PlanOption {
  id: string;
  name: string;
  priceUsd: number;
  seatLimit: number;
}

function statusBadgeVariant(status: string) {
  switch (status) {
    case "active":
      return "default" as const;
    case "pending":
      return "secondary" as const;
    case "suspended":
    case "past_due":
      return "destructive" as const;
    case "cancelled":
      return "outline" as const;
    default:
      return "outline" as const;
  }
}

export default function BillingPage() {
  const searchParams = useSearchParams();
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [canceling, setCanceling] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  // Handle return from PayPal
  useEffect(() => {
    const subscription = searchParams.get("subscription");
    const subId = searchParams.get("subscription_id");

    if (subscription === "success" && subId) {
      activateSubscription(subId);
    } else if (subscription === "canceled") {
      setMessage({ type: "error", text: "Subscription was canceled." });
    }
  }, [searchParams]);

  async function loadData() {
    try {
      const [billingData, planData] = await Promise.all([
        api.get<BillingInfo>("/api/billing"),
        api.get<PlanOption[]>("/api/billing/plans"),
      ]);
      setBilling(billingData);
      setPlans(planData);
    } catch {
      setBilling(null);
    } finally {
      setLoading(false);
    }
  }

  async function subscribe(planId: string) {
    setSubscribing(planId);
    setMessage(null);
    try {
      const data = await api.post<{ approvalUrl: string; subscriptionId: string }>(
        "/api/billing/subscribe",
        { plan: planId }
      );
      // Redirect to PayPal
      window.location.href = data.approvalUrl;
    } catch (err: unknown) {
      const error = err as { message?: string };
      setMessage({
        type: "error",
        text: error.message || "Failed to create subscription",
      });
      setSubscribing(null);
    }
  }

  async function activateSubscription(subscriptionId: string) {
    try {
      await api.post("/api/billing/activate", { subscriptionId });
      setMessage({ type: "success", text: "Subscription activated!" });
      await loadData();
    } catch {
      setMessage({
        type: "error",
        text: "Failed to activate. It may take a moment — refresh in a few seconds.",
      });
    }
  }

  async function handleCancel() {
    if (!confirm("Are you sure you want to cancel your subscription?")) return;
    setCanceling(true);
    try {
      await api.post("/api/billing/cancel");
      setMessage({ type: "success", text: "Subscription cancelled." });
      await loadData();
    } catch {
      setMessage({ type: "error", text: "Failed to cancel subscription." });
    } finally {
      setCanceling(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const info: BillingInfo = billing || {
    plan: "Free",
    seatCount: 1,
    seatLimit: 3,
    nextBillingDate: null,
    amount: 0,
    currency: "USD",
    status: "active",
    paypalSubscriptionId: null,
  };

  const isFree = info.plan === "Free";

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your subscription and billing details.
        </p>
      </div>

      {message && (
        <div
          className={`mb-6 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-green-500/30 bg-green-500/10 text-green-400"
              : "border-red-500/30 bg-red-500/10 text-red-400"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          {message.text}
        </div>
      )}

      {/* Current plan info */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Plan
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{info.plan}</span>
              <Badge variant={statusBadgeVariant(info.status)}>
                {info.status}
              </Badge>
            </div>
            {info.amount > 0 && (
              <p className="mt-1 text-sm text-muted-foreground">
                ${info.amount / 100}/month
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Seats
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {info.seatCount}{" "}
              <span className="text-base font-normal text-muted-foreground">
                / {info.seatLimit}
              </span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary transition-all"
                style={{
                  width: `${Math.min(100, (info.seatCount / info.seatLimit) * 100)}%`,
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Next Billing Date
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {info.nextBillingDate
                ? new Date(info.nextBillingDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "—"}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {info.nextBillingDate ? "Auto-renews monthly" : "No active billing"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Plan selection — only show if on free plan */}
      {isFree && plans.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold">Upgrade your plan</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {plans.map((plan) => (
              <Card key={plan.id} className="relative overflow-hidden">
                {plan.id === "pro" && (
                  <div className="absolute right-0 top-0 rounded-bl-lg bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                    Popular
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>
                    Up to {plan.seatLimit} team members
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <span className="text-3xl font-bold">${plan.priceUsd}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      {plan.seatLimit} seats
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      Unlimited sessions
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      Session recording
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      Audit logs
                    </li>
                    {plan.id === "enterprise" && (
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        SSO & priority support
                      </li>
                    )}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={() => subscribe(plan.id)}
                    disabled={subscribing !== null}
                  >
                    {subscribing === plan.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Redirecting to PayPal...
                      </>
                    ) : (
                      `Subscribe with PayPal`
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Manage existing subscription */}
      {!isFree && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Manage Subscription</CardTitle>
            <CardDescription>
              Your subscription is managed through PayPal. You can cancel
              anytime — access continues until the end of your billing period.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={canceling}
            >
              {canceling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Canceling...
                </>
              ) : (
                "Cancel Subscription"
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
