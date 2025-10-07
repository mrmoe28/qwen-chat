import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function MinimalInvoicePreview() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/templates">← Back to Templates</Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Minimal Invoice Template</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">Simple</Badge>
              <span className="text-sm text-muted-foreground">A simple, clean template with just the essentials</span>
            </div>
          </div>
        </div>
        <Button asChild>
          <Link href="/invoices/new?template=minimal-invoice">Use This Template</Link>
        </Button>
      </div>

      {/* Invoice Preview */}
      <Card className="max-w-3xl mx-auto">
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Header Section */}
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-gray-900">Jane Doe</h2>
                <p className="text-sm text-gray-600">Freelance Designer</p>
                <p className="text-sm text-gray-600">jane@example.com</p>
              </div>
              <div className="text-right">
                <h1 className="text-2xl font-bold text-gray-900">INVOICE</h1>
                <p className="text-sm text-gray-600 mt-1">#2024-001</p>
              </div>
            </div>

            {/* Bill To & Date */}
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">Bill To:</p>
                <div className="text-sm text-gray-600">
                  <p>Acme Corporation</p>
                  <p>123 Business St</p>
                  <p>New York, NY 10001</p>
                </div>
              </div>
              <div className="text-right text-sm text-gray-600">
                <p><span className="font-medium">Date:</span> March 15, 2024</p>
                <p><span className="font-medium">Due:</span> April 14, 2024</p>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-3">
              <div className="border-b border-gray-200 pb-2">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Logo Design</p>
                    <p className="text-sm text-gray-600">Brand identity and logo creation</p>
                  </div>
                  <p className="font-medium text-right ml-4">$800.00</p>
                </div>
              </div>
              
              <div className="border-b border-gray-200 pb-2">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Website Design</p>
                    <p className="text-sm text-gray-600">Homepage and 3 additional pages</p>
                  </div>
                  <p className="font-medium text-right ml-4">$1,200.00</p>
                </div>
              </div>
              
              <div className="border-b border-gray-200 pb-2">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Print Materials</p>
                    <p className="text-sm text-gray-600">Business cards and letterhead design</p>
                  </div>
                  <p className="font-medium text-right ml-4">$300.00</p>
                </div>
              </div>
            </div>

            {/* Total */}
            <div className="pt-4 border-t-2 border-gray-900">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">Total</span>
                <span className="text-lg font-bold">$2,300.00</span>
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-gray-50 p-4 rounded text-sm text-gray-600">
              <p><span className="font-medium">Payment Terms:</span> Due within 30 days</p>
              <p><span className="font-medium">Payment Methods:</span> Bank transfer, PayPal, Check</p>
            </div>

            {/* Thank You */}
            <div className="text-center text-sm text-gray-600">
              <p>Thank you for your business!</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Template Features */}
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Template Features</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-green-600">✓ Basic Details</h4>
                <p className="text-sm text-gray-600">Essential information only - no clutter</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-green-600">✓ Clean Layout</h4>
                <p className="text-sm text-gray-600">Simple, professional design</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-green-600">✓ Quick Creation</h4>
                <p className="text-sm text-gray-600">Fast setup with minimal fields</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-green-600">✓ Mobile Friendly</h4>
                <p className="text-sm text-gray-600">Optimized for all devices</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}