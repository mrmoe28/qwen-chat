"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icons";

interface SubscriptionStatus {
  status: string;
  isActive: boolean;
  freeInvoicesUsed?: number;
  freeInvoicesLimit?: number;
  freeInvoicesRemaining?: number;
}

export function TrialStatusBanner() {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

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
    try {
      const response = await fetch("/api/billing/create-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        }
      }
    } catch (error) {
      console.error("Error creating subscription:", error);
    }
  };

  if (isLoading || !subscriptionStatus) return null;

  // Only show for trial users
  if (subscriptionStatus.status !== "trial") return null;

  const remaining = subscriptionStatus.freeInvoicesRemaining || 0;
  const used = subscriptionStatus.freeInvoicesUsed || 0;
  const limit = subscriptionStatus.freeInvoicesLimit || 3;

  if (remaining <= 0) return null; // Will be handled by subscription gate

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-100 p-2">
              <Icon name="shield" className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-blue-900">
                Free Trial: {remaining} invoice{remaining !== 1 ? 's' : ''} remaining
              </p>
              <p className="text-sm text-blue-700">
                You&apos;ve used {used} of {limit} free invoices
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {Array.from({ length: limit }).map((_, i) => (
                <div
                  key={i}
                  className={`h-2 w-6 rounded-full ${
                    i < used ? 'bg-blue-600' : 'bg-blue-200'
                  }`}
                />
              ))}
            </div>
            <Button 
              onClick={createSubscription}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              Upgrade to Pro
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}