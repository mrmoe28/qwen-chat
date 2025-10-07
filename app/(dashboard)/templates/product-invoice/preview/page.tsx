import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ProductInvoicePreview() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/templates">← Back to Templates</Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Product Invoice Template</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">Products</Badge>
              <span className="text-sm text-muted-foreground">For businesses selling physical products</span>
            </div>
          </div>
        </div>
        <Button asChild>
          <Link href="/invoices/new?template=product-invoice">Use This Template</Link>
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
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">ElectroTech Supply Co.</h2>
                    <p className="text-sm text-gray-600">Electronics & Technology Products</p>
                  </div>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>567 Commerce Street</p>
                  <p>Retail City, State 98765</p>
                  <p>orders@electrotechsupply.com</p>
                  <p>(555) 456-7890</p>
                  <p>Tax ID: 12-3456789</p>
                </div>
              </div>
              <div className="text-right space-y-2">
                <h1 className="text-3xl font-bold text-green-600">INVOICE</h1>
                <div className="text-sm text-gray-600">
                  <p><span className="font-medium">Invoice #:</span> PRD-2024-156</p>
                  <p><span className="font-medium">Date:</span> March 15, 2024</p>
                  <p><span className="font-medium">Due Date:</span> April 14, 2024</p>
                  <p><span className="font-medium">PO Number:</span> PO-2024-ABC-789</p>
                </div>
              </div>
            </div>

            {/* Bill To & Ship To Section */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Bill To:</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900">RetailMax Inc.</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Mike Thompson, Purchasing</p>
                    <p>890 Retail Plaza</p>
                    <p>Commerce City, State 24680</p>
                    <p>mike@retailmax.com</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Ship To:</h3>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900">RetailMax Warehouse</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Warehouse Manager</p>
                    <p>1234 Distribution Center Dr</p>
                    <p>Logistics City, State 13579</p>
                    <p>warehouse@retailmax.com</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Products Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Products Ordered</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-green-50">
                    <tr className="text-left">
                      <th className="px-4 py-3 text-sm font-medium text-gray-900">SKU</th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-900">Product</th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-900 text-center">Qty</th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-900 text-right">Unit Price</th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-900 text-right">Discount</th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-900 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-4 text-sm font-mono text-gray-600">LTP-001</td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-gray-900">Wireless Laptop Stand</p>
                          <p className="text-sm text-gray-600">Aluminum, Height Adjustable, Silver</p>
                          <p className="text-xs text-gray-500">In Stock: 150 units</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">25</td>
                      <td className="px-4 py-4 text-right">$89.99</td>
                      <td className="px-4 py-4 text-right text-green-600">-10%</td>
                      <td className="px-4 py-4 text-right font-medium">$2,024.78</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-4 text-sm font-mono text-gray-600">KBD-205</td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-gray-900">Mechanical Keyboard</p>
                          <p className="text-sm text-gray-600">RGB Backlit, Cherry MX Blue, Black</p>
                          <p className="text-xs text-gray-500">In Stock: 75 units</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">15</td>
                      <td className="px-4 py-4 text-right">$129.99</td>
                      <td className="px-4 py-4 text-right">-</td>
                      <td className="px-4 py-4 text-right font-medium">$1,949.85</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-4 text-sm font-mono text-gray-600">MSE-102</td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-gray-900">Wireless Gaming Mouse</p>
                          <p className="text-sm text-gray-600">12000 DPI, Ergonomic, RGB, Black</p>
                          <p className="text-xs text-gray-500">In Stock: 200 units</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">30</td>
                      <td className="px-4 py-4 text-right">$79.99</td>
                      <td className="px-4 py-4 text-right text-green-600">-5%</td>
                      <td className="px-4 py-4 text-right font-medium">$2,279.73</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-4 text-sm font-mono text-gray-600">MON-034</td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-gray-900">4K Monitor 27&quot;</p>
                          <p className="text-sm text-gray-600">IPS Panel, USB-C, Height Adjustable</p>
                          <p className="text-xs text-gray-500">In Stock: 45 units</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">8</td>
                      <td className="px-4 py-4 text-right">$399.99</td>
                      <td className="px-4 py-4 text-right">-</td>
                      <td className="px-4 py-4 text-right font-medium">$3,199.92</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Shipping Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Shipping Details</h3>
              <div className="bg-blue-50 p-4 rounded-lg grid md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900">Shipping Method</h4>
                  <p className="text-sm text-gray-600">UPS Ground</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Estimated Delivery</h4>
                  <p className="text-sm text-gray-600">March 20-22, 2024</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Tracking</h4>
                  <p className="text-sm text-gray-600">Will be provided</p>
                </div>
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-96 space-y-2">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">$9,454.28</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Volume Discount:</span>
                  <span className="font-medium text-green-600">-$472.71</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Shipping & Handling:</span>
                  <span className="font-medium">$150.00</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Sales Tax (7.25%):</span>
                  <span className="font-medium">$651.80</span>
                </div>
                <div className="flex justify-between py-3 border-t-2 border-green-600 font-bold text-lg text-green-600">
                  <span>Total:</span>
                  <span>$9,783.37</span>
                </div>
              </div>
            </div>

            {/* Payment & Terms */}
            <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Payment Terms</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Payment Due:</span> Net 30 days
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Early Pay Discount:</span> 2% if paid within 10 days
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Payment Methods:</span> Bank transfer, Check, Credit card
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Return Policy</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Returns:</span> 30-day return policy
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Warranty:</span> 1-year manufacturer warranty
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Support:</span> support@electrotechsupply.com
                  </p>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">Notes</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p>Thank you for your business! All products are new and come with full manufacturer warranty.</p>
                <p>Volume discounts applied automatically for orders over 20 units per item.</p>
                <p>For any questions about this order, please contact our sales team.</p>
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
                <h4 className="font-medium text-green-600">✓ Product Catalog</h4>
                <p className="text-sm text-gray-600">SKU numbers, descriptions, and inventory status</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-green-600">✓ Quantity Discounts</h4>
                <p className="text-sm text-gray-600">Volume pricing and discount calculations</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-green-600">✓ Shipping Details</h4>
                <p className="text-sm text-gray-600">Shipping methods, costs, and delivery tracking</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-green-600">✓ Inventory Tracking</h4>
                <p className="text-sm text-gray-600">Real-time stock levels and availability</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}