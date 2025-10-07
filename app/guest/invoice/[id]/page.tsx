"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GuestService } from "@/lib/services/guest-service";
import { generateProfessionalInvoiceHTML } from "@/lib/utils/invoice-template";
import { SendGuestInvoiceButton } from "@/components/guest/send-guest-invoice-button";

interface GuestInvoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail?: string;
  amount: number;
  description: string;
  createdAt: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid';
  items: InvoiceItem[];
}

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export default function GuestInvoiceDetailPage() {
  const params = useParams();
  const [invoice, setInvoice] = useState<GuestInvoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      const invoiceData = GuestService.getInvoice(params.id as string);
      setInvoice(invoiceData);
      setLoading(false);
    }
  }, [params.id]);

  const handleStatusChange = () => {
    // Refresh the invoice data after status change
    if (params.id) {
      const updatedInvoice = GuestService.getInvoice(params.id as string);
      setInvoice(updatedInvoice);
    }
  };

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

    // Generate professional invoice HTML
    const invoiceHtml = generateProfessionalInvoiceHTML(invoice);

    // Create and download the file
    const blob = new Blob([invoiceHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoice.invoiceNumber}-${invoice.customerName.replace(/\s+/g, '-').toLowerCase()}.html`;
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
            {invoice.customerEmail && invoice.status !== 'sent' && (
              <SendGuestInvoiceButton 
                invoice={invoice} 
                onStatusChange={handleStatusChange}
              />
            )}
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
                <CardTitle className="text-2xl">Invoice {invoice.invoiceNumber}</CardTitle>
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
              <div className="space-y-1">
                <p className="text-lg font-medium">{invoice.customerName}</p>
                {invoice.customerEmail && (
                  <p className="text-muted-foreground">{invoice.customerEmail}</p>
                )}
              </div>
            </div>

            {/* Invoice Details */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Invoice Details:</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Invoice #:</span> {invoice.invoiceNumber}</p>
                  <p><span className="font-medium">Date:</span> {formatDate(invoice.createdAt)}</p>
                  <p><span className="font-medium">Due Date:</span> {formatDate(invoice.dueDate)}</p>
                  <p><span className="font-medium">Status:</span> {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}</p>
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Invoice Items:</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left py-3 px-4">Description</th>
                      <th className="text-center py-3 px-4">Qty</th>
                      <th className="text-right py-3 px-4">Rate</th>
                      <th className="text-right py-3 px-4">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="py-3 px-4">{item.description}</td>
                        <td className="text-center py-3 px-4">{item.quantity}</td>
                        <td className="text-right py-3 px-4">{formatAmount(item.rate)}</td>
                        <td className="text-right py-3 px-4 font-medium">{formatAmount(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="border-t bg-muted/30 py-3 px-4">
                  <div className="flex justify-between items-center font-semibold">
                    <span>Total:</span>
                    <span className="text-lg">{formatAmount(invoice.amount)}</span>
                  </div>
                </div>
              </div>
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