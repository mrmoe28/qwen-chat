import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ServiceInvoicePreview() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/templates">← Back to Templates</Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Service Invoice Template</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary">Services</Badge>
              <span className="text-sm text-muted-foreground">For consultants, freelancers, and service businesses</span>
            </div>
          </div>
        </div>
        <Button asChild>
          <Link href="/invoices/new?template=service-invoice">Use This Template</Link>
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
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Creative Solutions LLC</h2>
                    <p className="text-sm text-gray-600">Digital Marketing Consultant</p>
                  </div>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>789 Consultant Way</p>
                  <p>Freelance City, State 54321</p>
                  <p>hello@creativesolutions.com</p>
                  <p>(555) 987-6543</p>
                </div>
              </div>
              <div className="text-right space-y-2">
                <h1 className="text-3xl font-bold text-blue-600">INVOICE</h1>
                <div className="text-sm text-gray-600">
                  <p><span className="font-medium">Invoice #:</span> SRV-2024-028</p>
                  <p><span className="font-medium">Date:</span> March 15, 2024</p>
                  <p><span className="font-medium">Due Date:</span> March 30, 2024</p>
                  <p><span className="font-medium">Project:</span> Q1 Campaign</p>
                </div>
              </div>
            </div>

            {/* Bill To Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Bill To:</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900">TechStart Inc.</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Sarah Johnson, Marketing Director</p>
                  <p>321 Startup Boulevard</p>
                  <p>Innovation City, State 13579</p>
                  <p>sarah@techstart.com</p>
                </div>
              </div>
            </div>

            {/* Time Tracking Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Time & Services</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-blue-50">
                    <tr className="text-left">
                      <th className="px-4 py-3 text-sm font-medium text-gray-900">Date</th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-900">Description</th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-900 text-center">Hours</th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-900 text-right">Rate</th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-900 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-4 text-sm text-gray-600">Mar 1, 2024</td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-gray-900">Strategy Planning</p>
                          <p className="text-sm text-gray-600">Campaign strategy development and competitor analysis</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">4.5</td>
                      <td className="px-4 py-4 text-right">$125.00</td>
                      <td className="px-4 py-4 text-right font-medium">$562.50</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-4 text-sm text-gray-600">Mar 5, 2024</td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-gray-900">Content Creation</p>
                          <p className="text-sm text-gray-600">Social media content and ad copy development</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">6.0</td>
                      <td className="px-4 py-4 text-right">$100.00</td>
                      <td className="px-4 py-4 text-right font-medium">$600.00</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-4 text-sm text-gray-600">Mar 8, 2024</td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-gray-900">Campaign Setup</p>
                          <p className="text-sm text-gray-600">Google Ads and Facebook campaign configuration</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">3.0</td>
                      <td className="px-4 py-4 text-right">$125.00</td>
                      <td className="px-4 py-4 text-right font-medium">$375.00</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-4 text-sm text-gray-600">Mar 12, 2024</td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-gray-900">Performance Review</p>
                          <p className="text-sm text-gray-600">Weekly performance analysis and optimization</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">2.5</td>
                      <td className="px-4 py-4 text-right">$125.00</td>
                      <td className="px-4 py-4 text-right font-medium">$312.50</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              {/* Time Summary */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">Total Hours Worked:</span>
                  <span className="font-bold">16.0 hours</span>
                </div>
              </div>
            </div>

            {/* Project Milestones */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Project Progress</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
                  <h4 className="font-medium text-green-800">Completed</h4>
                  <p className="text-sm text-green-700">Strategy & Planning</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
                  <h4 className="font-medium text-yellow-800">In Progress</h4>
                  <p className="text-sm text-yellow-700">Campaign Execution</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-gray-300">
                  <h4 className="font-medium text-gray-600">Upcoming</h4>
                  <p className="text-sm text-gray-600">Results Analysis</p>
                </div>
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-80 space-y-2">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">$1,850.00</span>
                </div>
                <div className="flex justify-between py-3 border-t-2 border-blue-600 font-bold text-lg text-blue-600">
                  <span>Total:</span>
                  <span>$1,850.00</span>
                </div>
              </div>
            </div>

            {/* Payment Terms */}
            <div className="space-y-4 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Payment Information</h3>
              <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Payment Due:</span> Net 15 days
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Next Invoice:</span> Monthly recurring for ongoing services
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Payment Methods:</span> Bank transfer, PayPal, Credit card
                </p>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">Notes</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p>Thank you for choosing Creative Solutions for your marketing needs!</p>
                <p>Next milestone: Launch optimization phase by March 20th, 2024.</p>
                <p>For questions about this invoice or project status, please contact me anytime.</p>
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
                <h4 className="font-medium text-green-600">✓ Hourly Rates</h4>
                <p className="text-sm text-gray-600">Time tracking with different hourly rates</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-green-600">✓ Time Tracking</h4>
                <p className="text-sm text-gray-600">Detailed time logs with descriptions</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-green-600">✓ Project Descriptions</h4>
                <p className="text-sm text-gray-600">Clear project context and progress</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-green-600">✓ Milestone Billing</h4>
                <p className="text-sm text-gray-600">Track project phases and progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}