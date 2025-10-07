import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function RecurringInvoicePreview() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/templates">← Back to Templates</Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Recurring Invoice Template</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="success">Subscription</Badge>
              <span className="text-sm text-muted-foreground">For subscription services and recurring billing</span>
            </div>
          </div>
        </div>
        <Button asChild>
          <Link href="/invoices/new?template=recurring-invoice">Use This Template</Link>
        </Button>
      </div>

      {/* Invoice Preview */}
      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-8">
          <div className="space-y-8">
            {/* Header Section */}
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zM14 2a2 2 0 012 2v7a3 3 0 11-6 0V4a2 2 0 012-2h2z"/>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">CloudFlow SaaS</h2>
                    <p className="text-sm text-gray-600">Business Management Software</p>
                  </div>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>100 Tech Tower</p>
                  <p>Software City, State 11111</p>
                  <p>billing@cloudflow.com</p>
                  <p>(555) 123-SAAS</p>
                </div>
              </div>
              <div className="text-right space-y-2">
                <h1 className="text-3xl font-bold text-purple-600">SUBSCRIPTION INVOICE</h1>
                <div className="text-sm text-gray-600">
                  <p><span className="font-medium">Invoice #:</span> SUB-2024-Q1-042</p>
                  <p><span className="font-medium">Date:</span> March 15, 2024</p>
                  <p><span className="font-medium">Due Date:</span> March 30, 2024</p>
                  <p><span className="font-medium">Period:</span> April 1 - April 30, 2024</p>
                </div>
              </div>
            </div>

            {/* Subscription Info */}
            <div className="bg-purple-50 p-6 rounded-lg border-l-4 border-purple-400">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-purple-900">Monthly Subscription</h3>
                  <p className="text-purple-700">Professional Plan - Auto-renewal enabled</p>
                  <p className="text-sm text-purple-600 mt-1">Next billing date: May 1, 2024</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-purple-600">Customer ID: CUST-789012</p>
                  <p className="text-sm text-purple-600">Subscription ID: SUB-456789</p>
                </div>
              </div>
            </div>

            {/* Bill To Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Bill To:</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900">InnovateCorp LLC</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Jennifer Martinez, Finance Manager</p>
                  <p>456 Innovation Drive</p>
                  <p>Business Park, State 22222</p>
                  <p>jennifer@innovatecorp.com</p>
                </div>
              </div>
            </div>

            {/* Subscription Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Subscription Services</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-purple-50">
                    <tr className="text-left">
                      <th className="px-4 py-3 text-sm font-medium text-gray-900">Service</th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-900 text-center">Users</th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-900">Billing Period</th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-900 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-gray-900">Professional Plan</p>
                          <p className="text-sm text-gray-600">Advanced features, API access, priority support</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">25</td>
                      <td className="px-4 py-4">Apr 1 - Apr 30, 2024</td>
                      <td className="px-4 py-4 text-right font-medium">$2,475.00</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-gray-900">Additional Storage</p>
                          <p className="text-sm text-gray-600">Extra 500GB cloud storage</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">-</td>
                      <td className="px-4 py-4">Apr 1 - Apr 30, 2024</td>
                      <td className="px-4 py-4 text-right font-medium">$150.00</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-gray-900">Premium Support</p>
                          <p className="text-sm text-gray-600">24/7 dedicated support channel</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">-</td>
                      <td className="px-4 py-4">Apr 1 - Apr 30, 2024</td>
                      <td className="px-4 py-4 text-right font-medium">$299.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Usage Tracking */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Usage Summary - March 2024</h3>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900">Active Users</h4>
                  <p className="text-2xl font-bold text-blue-600">23 / 25</p>
                  <p className="text-xs text-blue-700">92% utilization</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900">Storage Used</h4>
                  <p className="text-2xl font-bold text-green-600">1.2TB</p>
                  <p className="text-xs text-green-700">80% of limit</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-medium text-orange-900">API Calls</h4>
                  <p className="text-2xl font-bold text-orange-600">847K</p>
                  <p className="text-xs text-orange-700">84% of limit</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium text-purple-900">Support Tickets</h4>
                  <p className="text-2xl font-bold text-purple-600">12</p>
                  <p className="text-xs text-purple-700">Avg response: 2h</p>
                </div>
              </div>
            </div>

            {/* Payment Schedule */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Payment Schedule</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium text-gray-900">Current Payment</h4>
                    <p className="text-gray-600">Due: March 30, 2024</p>
                    <p className="font-bold text-purple-600">$2,924.00</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Next Payment</h4>
                    <p className="text-gray-600">Due: April 30, 2024</p>
                    <p className="text-gray-600">$2,924.00 (estimated)</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Auto-Pay Status</h4>
                    <p className="text-green-600">✓ Enabled</p>
                    <p className="text-gray-600">Card ending in 4242</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-80 space-y-2">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">$2,924.00</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Annual Discount (10%):</span>
                  <span className="font-medium text-green-600">$0.00</span>
                </div>
                <div className="flex justify-between py-3 border-t-2 border-purple-600 font-bold text-lg text-purple-600">
                  <span>Total Due:</span>
                  <span>$2,924.00</span>
                </div>
              </div>
            </div>

            {/* Auto-billing Notice */}
            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800">Auto-billing Enabled</h4>
                  <p className="mt-1 text-sm text-blue-700">
                    This invoice will be automatically charged to your payment method on the due date. 
                    You can update your payment method or billing preferences in your account portal.
                  </p>
                </div>
              </div>
            </div>

            {/* Account Management */}
            <div className="space-y-4 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Account Management</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Customer Portal:</span> 
                  <a href="#" className="text-purple-600 hover:underline ml-1">portal.cloudflow.com</a>
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Support:</span> support@cloudflow.com or (555) 123-HELP
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Billing Questions:</span> billing@cloudflow.com
                </p>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">Notes</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p>Thank you for choosing CloudFlow SaaS! Your subscription includes all updates and new features.</p>
                <p>Consider upgrading to our Enterprise plan for unlimited users and advanced security features.</p>
                <p>Questions about your subscription? Visit our help center or contact our support team.</p>
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
                <h4 className="font-medium text-green-600">✓ Subscription Details</h4>
                <p className="text-sm text-gray-600">Clear subscription period and service information</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-green-600">✓ Auto-billing</h4>
                <p className="text-sm text-gray-600">Automated recurring payment processing</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-green-600">✓ Payment Schedules</h4>
                <p className="text-sm text-gray-600">Clear next payment dates and amounts</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-green-600">✓ Usage Tracking</h4>
                <p className="text-sm text-gray-600">Detailed usage metrics and utilization</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}