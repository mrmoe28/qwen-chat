"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GuestService } from "@/lib/services/guest-service";

interface GuestInvoice {
  id: string;
  customerName: string;
  amount: number;
  description: string;
  createdAt: string;
  status: 'draft' | 'sent' | 'paid';
}

export default function GuestInvoicesPage() {
  const [invoices, setInvoices] = useState<GuestInvoice[]>([]);
  const [stats, setStats] = useState(GuestService.getSessionStats());

  useEffect(() => {
    const loadedInvoices = GuestService.getInvoices();
    setInvoices(loadedInvoices);
    setStats(GuestService.getSessionStats());
  }, []);

  const formatAmount = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const downloadInvoice = (invoice: GuestInvoice) => {
    // Create a simple HTML invoice for download
    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice - ${invoice.customerName}</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; }
          .header { text-align: center; margin-bottom: 40px; }
          .invoice-details { display: flex; justify-content: space-between; margin-bottom: 40px; }
          .amount { font-size: 24px; font-weight: bold; color: #333; }
          .description { margin: 20px 0; }
          .footer { margin-top: 40px; text-align: center; color: #666; font-size: 14px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>INVOICE</h1>
          <p>Created with Ledgerflow</p>
        </div>
        
        <div class="invoice-details">
          <div>
            <h3>Bill To:</h3>
            <p><strong>${invoice.customerName}</strong></p>
          </div>
          <div>
            <h3>Invoice Details:</h3>
            <p>Date: ${formatDate(invoice.createdAt)}</p>
            <p>Status: ${invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}</p>
          </div>
        </div>
        
        <div class="description">
          <h3>Description:</h3>
          <p>${invoice.description}</p>
        </div>
        
        <div class="amount">
          <h3>Total Amount: ${formatAmount(invoice.amount)}</h3>
        </div>
        
        <div class="footer">
          <p>Thank you for your business!</p>
          <p>This invoice was created with Ledgerflow - Professional invoicing made simple</p>
        </div>
      </body>
      </html>
    `;

    // Create and download the file
    const blob = new Blob([invoiceHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${invoice.customerName.replace(/\s+/g, '-').toLowerCase()}-${invoice.id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (invoices.length === 0) {
    return (
      <div className="min-h-screen bg-muted/50 px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-6">
            <h1 className="text-3xl font-bold">Your Invoices</h1>
            <p className="text-muted-foreground">
              You haven&apos;t created any invoices yet. Get started with your first free invoice!
            </p>
            <Link href="/guest">
              <Button>Create Your First Invoice</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/50 px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Your Invoices</h1>
            <p className="text-muted-foreground">
              {stats.invoicesRemaining > 0 ? (
                <>You have {stats.invoicesRemaining} free invoice{stats.invoicesRemaining !== 1 ? 's' : ''} remaining</>
              ) : (
                <>You&apos;ve used all your free invoices</>
              )}
            </p>
          </div>
          <div className="space-x-2">
            {stats.canCreateMore ? (
              <Link href="/guest">
                <Button>Create New Invoice</Button>
              </Link>
            ) : (
              <Link href="/sign-up">
                <Button>Sign Up for More</Button>
              </Link>
            )}
          </div>
        </div>

        {/* Usage Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Free Trial Progress</CardTitle>
            <CardDescription>
              Track your free invoice usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-2">
                  <span>{stats.invoicesCreated} of {stats.invoiceLimit} used</span>
                  <span>{stats.invoicesRemaining} remaining</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(stats.invoicesCreated / stats.invoiceLimit) * 100}%` }}
                  />
                </div>
              </div>
              {stats.shouldPromptSignup && (
                <Link href="/sign-up">
                  <Button size="sm">Upgrade Now</Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Invoices List */}
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <Card key={invoice.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-semibold text-lg">{invoice.customerName}</h3>
                      <Badge className={getStatusColor(invoice.status)}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">{invoice.description}</p>
                    <p className="text-sm text-muted-foreground">
                      Created on {formatDate(invoice.createdAt)}
                    </p>
                  </div>
                  <div className="text-right space-y-2">
                    <p className="text-2xl font-bold">{formatAmount(invoice.amount)}</p>
                    <div className="space-x-2">
                      <Link href={`/guest/invoice/${invoice.id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => downloadInvoice(invoice)}
                      >
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        {stats.shouldPromptSignup && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6 text-center space-y-4">
              <h3 className="text-xl font-semibold">Ready for unlimited invoices?</h3>
              <p className="text-muted-foreground">
                You&apos;ve tried our free plan. Sign up now to create unlimited professional invoices with advanced features.
              </p>
              <Link href="/sign-up">
                <Button size="lg">Sign Up Now</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}