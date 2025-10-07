import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function StandardInvoicePreview() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/templates">← Back to Templates</Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Standard Invoice Template</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="default">General</Badge>
              <span className="text-sm text-muted-foreground">Professional business invoicing</span>
            </div>
          </div>
        </div>
        <Button asChild>
          <Link href="/invoices/new?template=standard-invoice">Use This Template</Link>
        </Button>
      </div>

      {/* Invoice Preview */}
      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-8">
          {/* Invoice Preview Content */}
          <div className="space-y-8">
            {/* Header Section */}
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6z"/>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Your Company Name</h2>
                    <p className="text-sm text-gray-600">Professional Services</p>
                  </div>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>123 Business Street</p>
                  <p>City, State 12345</p>
                  <p>contact@company.com</p>
                  <p>(555) 123-4567</p>
                </div>
              </div>
              <div className="text-right space-y-2">
                <h1 className="text-3xl font-bold text-gray-900">INVOICE</h1>
                <div className="text-sm text-gray-600">
                  <p><span className="font-medium">Invoice #:</span> INV-2024-001</p>
                  <p><span className="font-medium">Date:</span> March 15, 2024</p>
                  <p><span className="font-medium">Due Date:</span> April 14, 2024</p>
                </div>
              </div>
            </div>

            {/* Bill To Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Bill To:</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900">ABC Corporation</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>John Smith, Procurement Manager</p>
                  <p>456 Client Avenue</p>
                  <p>Client City, State 67890</p>
                  <p>john.smith@abccorp.com</p>
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Services</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr className="text-left">
                      <th className="px-4 py-3 text-sm font-medium text-gray-900">Description</th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-900 text-center">Qty</th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-900 text-right">Rate</th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-900 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-gray-900">Website Development</p>
                          <p className="text-sm text-gray-600">Custom responsive website with CMS</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">1</td>
                      <td className="px-4 py-4 text-right">$5,000.00</td>
                      <td className="px-4 py-4 text-right font-medium">$5,000.00</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-gray-900">SEO Optimization</p>
                          <p className="text-sm text-gray-600">On-page SEO and technical optimization</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">1</td>
                      <td className="px-4 py-4 text-right">$1,200.00</td>
                      <td className="px-4 py-4 text-right font-medium">$1,200.00</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-gray-900">Content Creation</p>
                          <p className="text-sm text-gray-600">Homepage and service pages content</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">5</td>
                      <td className="px-4 py-4 text-right">$150.00</td>
                      <td className="px-4 py-4 text-right font-medium">$750.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-80 space-y-2">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">$6,950.00</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Tax (8.5%):</span>
                  <span className="font-medium">$590.75</span>
                </div>
                <div className="flex justify-between py-3 border-t-2 border-gray-900 font-bold text-lg">
                  <span>Total:</span>
                  <span>$7,540.75</span>
                </div>
              </div>
            </div>

            {/* Payment Terms */}
            <div className="space-y-4 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Payment Terms</h3>
              <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Payment Due:</span> Net 30 days
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Late Fee:</span> 1.5% per month on overdue amounts
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Payment Methods:</span> Bank transfer, Check, Credit card
                </p>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">Notes</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p>Thank you for your business! We appreciate the opportunity to work with you.</p>
                <p>If you have any questions about this invoice, please contact us at the information above.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Template Features */}
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Template Features</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-green-600">✓ Company Branding</h4>
                <p className="text-sm text-gray-600">Logo, colors, and business information</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-green-600">✓ Line Items</h4>
                <p className="text-sm text-gray-600">Detailed service/product descriptions</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-green-600">✓ Tax Calculations</h4>
                <p className="text-sm text-gray-600">Automatic tax calculation and display</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-green-600">✓ Payment Terms</h4>
                <p className="text-sm text-gray-600">Clear payment instructions and terms</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}