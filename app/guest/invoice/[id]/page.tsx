"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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

export default function GuestInvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<GuestInvoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      const invoiceData = GuestService.getInvoice(params.id as string);
      setInvoice(invoiceData);
      setLoading(false);
    }
  }, [params.id]);

  const formatAmount = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
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

  const handleDownload = () => {
    if (!invoice) return;

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

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/50 px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-muted/50 px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">Invoice Not Found</h1>
            <p className="text-muted-foreground">
              The invoice you&apos;re looking for doesn&apos;t exist or may have been removed.
            </p>
            <Link href="/guest/invoices">
              <Button>Back to Invoices</Button>
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
          <div className="flex items-center space-x-4">
            <Link href="/guest/invoices">
              <Button variant="outline" size="sm">
                ← Back to Invoices
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Invoice Details</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={handleDownload} variant="outline">
              Download
            </Button>
            <Badge className={getStatusColor(invoice.status)}>
              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
            </Badge>
          </div>
        </div>

        {/* Invoice Details */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">Invoice</CardTitle>
                <CardDescription>Created with Ledgerflow</CardDescription>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{formatAmount(invoice.amount)}</div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Customer Info */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Bill To:</h3>
              <p className="text-lg">{invoice.customerName}</p>
            </div>

            {/* Invoice Details */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Invoice Details:</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Date:</span> {formatDate(invoice.createdAt)}</p>
                  <p><span className="font-medium">Status:</span> {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Description:</h3>
              <p className="text-muted-foreground">{invoice.description}</p>
            </div>

            {/* Actions */}
            <div className="border-t pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={handleDownload} className="flex-1">
                  Download Invoice
                </Button>
                <Link href="/guest/invoices" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Back to All Invoices
                  </Button>
                </Link>
                <Link href="/guest" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Create Another Invoice
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upgrade CTA */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6 text-center space-y-4">
            <h3 className="text-xl font-semibold">Want more professional features?</h3>
            <p className="text-muted-foreground">
              Sign up to get payment processing, automatic reminders, customer management, and unlimited invoices.
            </p>
            <Link href="/sign-up">
              <Button size="lg">Upgrade to Pro</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}