"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GuestService } from "@/lib/services/guest-service";

interface GuestInvoiceFormData {
  customerName: string;
  customerEmail: string;
  amount: string;
  description: string;
}

export function GuestInvoiceForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<GuestInvoiceFormData>();

  const onSubmit = async (data: GuestInvoiceFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      if (!GuestService.canCreateInvoice()) {
        setError("You've reached your free invoice limit. Please sign up to continue.");
        return;
      }

      const amount = parseFloat(data.amount);
      if (isNaN(amount) || amount <= 0) {
        setError("Please enter a valid amount.");
        return;
      }

      const invoice = GuestService.createInvoice({
        customerName: data.customerName.trim(),
        customerEmail: data.customerEmail.trim(),
        amount: Math.round(amount * 100), // Convert to cents
        description: data.description.trim(),
      });

      if (!invoice) {
        setError("Unable to create invoice. Please try again.");
        return;
      }

      reset();
      
      // Check if this was their last free invoice
      const stats = GuestService.getSessionStats();
      if (stats.shouldPromptSignup) {
        router.push('/guest/signup-prompt');
      } else {
        router.push('/guest/invoices');
      }
      
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error('Guest invoice creation error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stats = GuestService.getSessionStats();

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create Your Invoice</CardTitle>
        <CardDescription>
          {stats.invoicesRemaining > 0 ? (
            <>You have {stats.invoicesRemaining} free invoice{stats.invoicesRemaining !== 1 ? 's' : ''} remaining</>
          ) : (
            <>You&apos;ve used all your free invoices. Sign up to continue.</>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!stats.canCreateMore ? (
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              You&apos;ve created {stats.invoicesCreated} free invoices. Sign up now to create unlimited invoices!
            </p>
            <Button onClick={() => router.push('/sign-up')} className="w-full">
              Sign Up Now
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                placeholder="Enter customer name"
                {...register("customerName", { 
                  required: "Customer name is required",
                  minLength: { value: 2, message: "Name must be at least 2 characters" }
                })}
              />
              {errors.customerName && (
                <p className="text-sm text-destructive">{errors.customerName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerEmail">Customer Email</Label>
              <Input
                id="customerEmail"
                type="email"
                placeholder="customer@example.com"
                {...register("customerEmail", { 
                  required: "Customer email is required",
                  pattern: { 
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Please enter a valid email address"
                  }
                })}
              />
              {errors.customerEmail && (
                <p className="text-sm text-destructive">{errors.customerEmail.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                {...register("amount", { 
                  required: "Amount is required",
                  min: { value: 0.01, message: "Amount must be greater than $0" }
                })}
              />
              {errors.amount && (
                <p className="text-sm text-destructive">{errors.amount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="What is this invoice for?"
                rows={3}
                {...register("description", { 
                  required: "Description is required",
                  minLength: { value: 5, message: "Description must be at least 5 characters" }
                })}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded p-3">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? "Creating..." : "Create Invoice"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push('/guest/invoices')}
              >
                View My Invoices
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}