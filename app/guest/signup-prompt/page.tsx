"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/icons";
import { GuestService } from "@/lib/services/guest-service";

export default function SignupPromptPage() {
  const [stats, setStats] = useState(GuestService.getSessionStats());

  useEffect(() => {
    setStats(GuestService.getSessionStats());
  }, []);

  return (
    <div className="min-h-screen bg-muted/50 px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Success Message */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Icon name="check" className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-green-900">Invoice Created Successfully!</h2>
              <p className="text-green-700 mt-2">
                You&apos;ve now created {stats.invoicesCreated} of your {stats.invoiceLimit} free invoices.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Upgrade Prompt */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Ready to Unlock More?</CardTitle>
            <CardDescription className="text-lg">
              You&apos;ve experienced how easy invoice creation can be. Sign up now for unlimited invoices and advanced features.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Features */}
            <div className="grid gap-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                  <Icon name="plus" className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">Unlimited Invoices</h4>
                  <p className="text-sm text-muted-foreground">Create as many invoices as you need</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                  <Icon name="users" className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">Customer Management</h4>
                  <p className="text-sm text-muted-foreground">Save customer details for easy repeat invoicing</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                  <Icon name="creditCard" className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">Payment Processing</h4>
                  <p className="text-sm text-muted-foreground">Accept payments via Square with automatic tracking</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                  <Icon name="barChart" className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">Analytics & Reports</h4>
                  <p className="text-sm text-muted-foreground">Track your business performance with detailed reports</p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-3 pt-4">
              <Link href="/sign-up" className="block">
                <Button size="lg" className="w-full">
                  Start Your Free Trial - 3 More Invoices
                </Button>
              </Link>
              <div className="text-center space-y-2">
                <Link href="/guest/invoices">
                  <Button variant="outline" className="w-full">
                    View My Free Invoices
                  </Button>
                </Link>
                <p className="text-xs text-muted-foreground">
                  No credit card required • Cancel anytime
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Testimonial or Social Proof */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6 text-center">
            <blockquote className="text-lg italic text-muted-foreground">
              &ldquo;Ledgerflow made invoicing so simple. I went from 30 minutes per invoice to just 2 minutes!&rdquo;
            </blockquote>
            <footer className="mt-2 text-sm font-medium">
              — Sarah, Freelance Designer
            </footer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}