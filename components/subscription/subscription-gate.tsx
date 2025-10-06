"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icons";

interface SubscriptionStatus {
  status: string;
  plan?: string;
  subscriptionId?: string;
  expiry?: string;
  isActive: boolean;
  hasSquareCustomer: boolean;
}

interface SubscriptionGateProps {
  children: React.ReactNode;
  planVariationId?: string;
}

export function SubscriptionGate({ children, planVariationId }: SubscriptionGateProps) {
  const { data: session, status } = useSession();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingSubscription, setIsCreatingSubscription] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      fetchSubscriptionStatus();
    }
  }, [status]);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch("/api/billing/status");
      if (response.ok) {
        const data = await response.json();
        setSubscriptionStatus(data);
      }
    } catch (error) {
      console.error("Failed to fetch subscription status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createSubscription = async () => {
    setIsCreatingSubscription(true);
    try {
      const response = await fetch("/api/billing/create-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planVariationId: planVariationId || process.env.NEXT_PUBLIC_SQUARE_PLAN_VARIATION_ID,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        }
      } else {
        console.error("Failed to create subscription");
      }
    } catch (error) {
      console.error("Error creating subscription:", error);
    } finally {
      setIsCreatingSubscription(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Icon name="loader" className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4 py-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please sign in to access the dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href="/sign-in">Sign In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!subscriptionStatus?.isActive) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4 py-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Icon name="shield" className="mx-auto h-12 w-12 text-primary mb-4" />
            <CardTitle>Subscription Required</CardTitle>
            <CardDescription>
              {subscriptionStatus?.status === "canceled" 
                ? "Your subscription has been canceled. Reactivate to continue using Ledgerflow."
                : "Subscribe to access the full Ledgerflow dashboard and start managing your invoices."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-muted/50 p-4">
              <h3 className="font-medium mb-2">What you&apos;ll get:</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Icon name="check" className="h-4 w-4 text-green-600" />
                  Unlimited invoices and customers
                </li>
                <li className="flex items-center gap-2">
                  <Icon name="check" className="h-4 w-4 text-green-600" />
                  Square payment processing
                </li>
                <li className="flex items-center gap-2">
                  <Icon name="check" className="h-4 w-4 text-green-600" />
                  Revenue tracking and analytics
                </li>
                <li className="flex items-center gap-2">
                  <Icon name="check" className="h-4 w-4 text-green-600" />
                  Email notifications and reminders
                </li>
              </ul>
            </div>
            
            {subscriptionStatus?.status === "canceled" ? (
              <Button 
                onClick={() => {
                  // Handle reactivation
                  fetch("/api/billing/manage", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "reactivate" }),
                  }).then(() => {
                    fetchSubscriptionStatus();
                  });
                }}
                className="w-full"
              >
                Reactivate Subscription
              </Button>
            ) : (
              <Button 
                onClick={createSubscription}
                disabled={isCreatingSubscription}
                className="w-full"
              >
                {isCreatingSubscription ? (
                  <>
                    <Icon name="loader" className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Subscribe Now"
                )}
              </Button>
            )}
            
            <p className="text-xs text-center text-muted-foreground">
              Current status: {subscriptionStatus?.status || "none"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User has active subscription, show the protected content
  return <>{children}</>;
}