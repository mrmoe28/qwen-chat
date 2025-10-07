import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DepositInvoicePreview() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/templates">← Back to Templates</Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Deposit Invoice Template</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="warning">Deposits</Badge>
              <span className="text-sm text-muted-foreground">For projects requiring upfront deposits or milestone payments</span>
            </div>
          </div>
        </div>
        <Button asChild>
          <Link href="/invoices/new?template=deposit-invoice">Use This Template</Link>
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
                  <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zM14 6a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h10zM4 14a2 2 0 100 4h8a2 2 0 100-4H4z"/>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">BuildPro Construction</h2>
                    <p className="text-sm text-gray-600">Custom Home Builder & Renovations</p>
                  </div>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>555 Builder&apos;s Lane</p>
                  <p>Construction City, State 87654</p>
                  <p>info@buildproconstruction.com</p>
                  <p>(555) 234-5678</p>
                  <p>License #: CON-2024-8901</p>
                </div>
              </div>
              <div className="text-right space-y-2">
                <h1 className="text-3xl font-bold text-yellow-600">DEPOSIT INVOICE</h1>
                <div className="text-sm text-gray-600">
                  <p><span className="font-medium">Invoice #:</span> DEP-2024-045</p>
                  <p><span className="font-medium">Date:</span> March 15, 2024</p>
                  <p><span className="font-medium">Due Date:</span> March 22, 2024</p>
                  <p><span className="font-medium">Project #:</span> HOME-2024-KIT-001</p>
                </div>
              </div>
            </div>

            {/* Project Overview */}
            <div className="bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-400">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-yellow-900">Kitchen Renovation Project</h3>
                  <p className="text-yellow-700">Complete kitchen remodel with custom cabinetry</p>
                  <p className="text-sm text-yellow-600 mt-1">Estimated completion: 8-10 weeks</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-yellow-600">Contract Total: $45,000.00</p>
                  <p className="text-sm text-yellow-600">This Payment: 30% Deposit</p>
                </div>
              </div>
            </div>

            {/* Bill To Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Bill To:</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900">Robert & Linda Wilson</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>234 Maple Street</p>
                  <p>Residential Hills, State 45678</p>
                  <p>robert.wilson@email.com</p>
                  <p>(555) 789-0123</p>
                </div>
              </div>
            </div>

            {/* Payment Breakdown */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Payment Breakdown</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-yellow-50">
                    <tr className="text-left">
                      <th className="px-4 py-3 text-sm font-medium text-gray-900">Phase</th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-900">Description</th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-900 text-right">Amount</th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-900 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr className="bg-yellow-25">
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-gray-900">Deposit</p>
                          <p className="text-sm text-gray-600">30% upfront payment</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-gray-900">Project start deposit</p>
                          <p className="text-sm text-gray-600">Covers materials ordering and project initiation</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right font-medium text-yellow-600">$13,500.00</td>
                      <td className="px-4 py-4 text-center">
                        <Badge variant="warning">Due Now</Badge>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-gray-900">Progress Payment 1</p>
                          <p className="text-sm text-gray-600">40% at demo completion</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-gray-900">Demolition and framing complete</p>
                          <p className="text-sm text-gray-600">Due upon completion of structural work</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right font-medium">$18,000.00</td>
                      <td className="px-4 py-4 text-center">
                        <Badge variant="outline">Pending</Badge>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-gray-900">Progress Payment 2</p>
                          <p className="text-sm text-gray-600">25% at installation</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-gray-900">Cabinet and countertop installation</p>
                          <p className="text-sm text-gray-600">Due upon major installation completion</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right font-medium">$11,250.00</td>
                      <td className="px-4 py-4 text-center">
                        <Badge variant="outline">Pending</Badge>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-gray-900">Final Payment</p>
                          <p className="text-sm text-gray-600">5% at completion</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-gray-900">Project completion and cleanup</p>
                          <p className="text-sm text-gray-600">Due upon final walkthrough and approval</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right font-medium">$2,250.00</td>
                      <td className="px-4 py-4 text-center">
                        <Badge variant="outline">Pending</Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Project Timeline */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Project Timeline</h3>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
                  <h4 className="font-medium text-yellow-800">Week 1-2</h4>
                  <p className="text-sm text-yellow-700">Demolition & Prep</p>
                  <p className="text-xs text-yellow-600">After deposit payment</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                  <h4 className="font-medium text-blue-800">Week 3-5</h4>
                  <p className="text-sm text-blue-700">Electrical & Plumbing</p>
                  <p className="text-xs text-blue-600">Progress payment 1</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
                  <h4 className="font-medium text-green-800">Week 6-8</h4>
                  <p className="text-sm text-green-700">Installation Phase</p>
                  <p className="text-xs text-green-600">Progress payment 2</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-400">
                  <h4 className="font-medium text-purple-800">Week 9-10</h4>
                  <p className="text-sm text-purple-700">Finishing & Cleanup</p>
                  <p className="text-xs text-purple-600">Final payment</p>
                </div>
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-96 space-y-2">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Contract Total:</span>
                  <span className="font-medium">$45,000.00</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Previous Payments:</span>
                  <span className="font-medium">$0.00</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Remaining Balance:</span>
                  <span className="font-medium">$31,500.00</span>
                </div>
                <div className="flex justify-between py-3 border-t-2 border-yellow-600 font-bold text-lg text-yellow-600">
                  <span>Amount Due Now:</span>
                  <span>$13,500.00</span>
                </div>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Payment Terms</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Deposit Due:</span> 7 days from invoice date
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Late Fee:</span> 2% per month on overdue amounts
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Work Start:</span> Upon deposit clearance
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Important Notes</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Materials:</span> Ordered after deposit payment
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Changes:</span> Additional work requires written approval
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Warranty:</span> 2-year workmanship guarantee
                  </p>
                </div>
              </div>
            </div>

            {/* Progress Tracking */}
            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800">Project Progress Updates</h4>
                  <p className="mt-1 text-sm text-blue-700">
                    You will receive weekly progress updates with photos and milestone completion notifications. 
                    Each payment phase includes a walkthrough and approval process.
                  </p>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">Notes</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p>Thank you for choosing BuildPro Construction for your kitchen renovation!</p>
                <p>All work is fully insured and performed by licensed contractors.</p>
                <p>For project updates or questions, contact your project manager: Mike Johnson (555) 234-5679.</p>
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
                <h4 className="font-medium text-green-600">✓ Deposit Amounts</h4>
                <p className="text-sm text-gray-600">Clear deposit and milestone payment breakdowns</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-green-600">✓ Payment Milestones</h4>
                <p className="text-sm text-gray-600">Progress-based payment schedules</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-green-600">✓ Balance Tracking</h4>
                <p className="text-sm text-gray-600">Remaining balance and payment history</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-green-600">✓ Project Phases</h4>
                <p className="text-sm text-gray-600">Timeline and milestone visualization</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}