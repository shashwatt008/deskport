"use client";

import { useEffect, useState } from "react";
import { CreditCard, Users, Calendar, ExternalLink } from "lucide-react";
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
  nextBillingDate: string;
  amount: number;
  currency: string;
  status: "active" | "trialing" | "past_due" | "canceled";
}

function planBadgeVariant(status: string) {
  switch (status) {
    case "active":
      return "default" as const;
    case "trialing":
      return "secondary" as const;
    case "past_due":
      return "destructive" as const;
    case "canceled":
      return "outline" as const;
    default:
      return "outline" as const;
  }
}

export default function BillingPage() {
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBilling();
  }, []);

  async function loadBilling() {
    try {
      const data = await api.get<BillingInfo>("/api/billing");
      setBilling(data);
    } catch {
      setBilling(null);
    } finally {
      setLoading(false);
    }
  }

  async function openBillingPortal() {
    try {
      const data = await api.post<{ url: string }>("/api/billing/portal");
      window.open(data.url, "_blank");
    } catch {
      // Error handled by API client
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
    nextBillingDate: new Date().toISOString(),
    amount: 0,
    currency: "USD",
    status: "active",
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your subscription and billing details.
        </p>
      </div>

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
              <Badge variant={planBadgeVariant(info.status)}>{info.status}</Badge>
            </div>
            {info.amount > 0 && (
              <p className="mt-1 text-sm text-muted-foreground">
                ${info.amount / 100}/{info.currency.toUpperCase()} per month
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
              {new Date(info.nextBillingDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Auto-renews monthly
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Manage Subscription</CardTitle>
          <CardDescription>
            Update your payment method, change plans, or view invoices through
            the billing portal.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={openBillingPortal}>
            <ExternalLink className="h-4 w-4" />
            Manage Billing
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
