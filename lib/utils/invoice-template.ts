interface InvoiceData {
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

export function generateProfessionalInvoiceHTML(invoice: InvoiceData): string {
  const formatAmount = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const subtotal = invoice.items.reduce((sum, item) => sum + item.amount, 0);
  const taxRate = 0; // No tax for trial invoices
  const taxAmount = Math.round(subtotal * taxRate);
  const total = subtotal + taxAmount;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoice.invoiceNumber} - ${invoice.customerName}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            background: #fff;
        }
        
        .invoice-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #3b82f6;
        }
        
        .company-info {
            flex: 1;
        }
        
        .company-name {
            font-size: 28px;
            font-weight: bold;
            color: #3b82f6;
            margin-bottom: 8px;
        }
        
        .company-tagline {
            color: #666;
            font-size: 14px;
            margin-bottom: 16px;
        }
        
        .invoice-title {
            text-align: right;
            flex: 1;
        }
        
        .invoice-title h1 {
            font-size: 36px;
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 8px;
        }
        
        .invoice-number {
            font-size: 18px;
            color: #3b82f6;
            font-weight: 600;
        }
        
        .invoice-details {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
            gap: 40px;
        }
        
        .bill-to, .invoice-info {
            flex: 1;
        }
        
        .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .customer-info {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #3b82f6;
        }
        
        .customer-name {
            font-size: 18px;
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 4px;
        }
        
        .customer-email {
            color: #64748b;
            font-size: 14px;
        }
        
        .invoice-meta {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
        }
        
        .meta-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
        }
        
        .meta-label {
            font-weight: 600;
            color: #475569;
        }
        
        .meta-value {
            color: #1e293b;
        }
        
        .status {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .status.draft {
            background: #f3f4f6;
            color: #374151;
        }
        
        .status.sent {
            background: #dbeafe;
            color: #1d4ed8;
        }
        
        .status.paid {
            background: #d1fae5;
            color: #059669;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            background: #fff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .items-table th {
            background: #3b82f6;
            color: white;
            padding: 16px;
            text-align: left;
            font-weight: 600;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .items-table td {
            padding: 16px;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .items-table tr:last-child td {
            border-bottom: none;
        }
        
        .items-table tr:nth-child(even) {
            background: #f9fafb;
        }
        
        .text-right {
            text-align: right;
        }
        
        .text-center {
            text-align: center;
        }
        
        .totals-section {
            max-width: 400px;
            margin-left: auto;
            background: #f8fafc;
            padding: 24px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        }
        
        .total-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .total-row:last-child {
            border-bottom: none;
            border-top: 2px solid #3b82f6;
            padding-top: 16px;
            margin-top: 16px;
            font-size: 20px;
            font-weight: bold;
            color: #1e293b;
        }
        
        .total-label {
            font-weight: 600;
            color: #475569;
        }
        
        .total-amount {
            font-weight: 600;
            color: #1e293b;
        }
        
        .payment-info {
            margin-top: 40px;
            padding: 24px;
            background: #f0f9ff;
            border-radius: 8px;
            border-left: 4px solid #0ea5e9;
        }
        
        .payment-title {
            font-size: 18px;
            font-weight: bold;
            color: #0c4a6e;
            margin-bottom: 12px;
        }
        
        .payment-text {
            color: #075985;
            line-height: 1.6;
        }
        
        .footer {
            margin-top: 60px;
            padding-top: 24px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #64748b;
        }
        
        .footer-logo {
            font-size: 20px;
            font-weight: bold;
            color: #3b82f6;
            margin-bottom: 8px;
        }
        
        .footer-text {
            font-size: 14px;
            line-height: 1.5;
        }
        
        @media print {
            body {
                padding: 20px;
            }
            
            .no-print {
                display: none;
            }
        }
        
        @media (max-width: 600px) {
            .invoice-header {
                flex-direction: column;
                gap: 20px;
            }
            
            .invoice-title {
                text-align: left;
            }
            
            .invoice-details {
                flex-direction: column;
                gap: 24px;
            }
            
            .items-table {
                font-size: 14px;
            }
            
            .items-table th,
            .items-table td {
                padding: 12px 8px;
            }
        }
    </style>
</head>
<body>
    <div class="invoice-header">
        <div class="company-info">
            <div class="company-name">Ledgerflow</div>
            <div class="company-tagline">Professional Invoicing Made Simple</div>
        </div>
        <div class="invoice-title">
            <h1>INVOICE</h1>
            <div class="invoice-number">${invoice.invoiceNumber}</div>
        </div>
    </div>

    <div class="invoice-details">
        <div class="bill-to">
            <div class="section-title">Bill To</div>
            <div class="customer-info">
                <div class="customer-name">${invoice.customerName}</div>
                ${invoice.customerEmail ? `<div class="customer-email">${invoice.customerEmail}</div>` : ''}
            </div>
        </div>
        
        <div class="invoice-info">
            <div class="section-title">Invoice Details</div>
            <div class="invoice-meta">
                <div class="meta-row">
                    <span class="meta-label">Invoice Date:</span>
                    <span class="meta-value">${formatDate(invoice.createdAt)}</span>
                </div>
                <div class="meta-row">
                    <span class="meta-label">Due Date:</span>
                    <span class="meta-value">${formatDate(invoice.dueDate)}</span>
                </div>
                <div class="meta-row">
                    <span class="meta-label">Status:</span>
                    <span class="meta-value">
                        <span class="status ${invoice.status}">${invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}</span>
                    </span>
                </div>
            </div>
        </div>
    </div>

    <table class="items-table">
        <thead>
            <tr>
                <th>Description</th>
                <th class="text-center">Qty</th>
                <th class="text-right">Rate</th>
                <th class="text-right">Amount</th>
            </tr>
        </thead>
        <tbody>
            ${invoice.items.map(item => `
                <tr>
                    <td>${item.description}</td>
                    <td class="text-center">${item.quantity}</td>
                    <td class="text-right">${formatAmount(item.rate)}</td>
                    <td class="text-right">${formatAmount(item.amount)}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    <div class="totals-section">
        <div class="total-row">
            <span class="total-label">Subtotal:</span>
            <span class="total-amount">${formatAmount(subtotal)}</span>
        </div>
        ${taxAmount > 0 ? `
        <div class="total-row">
            <span class="total-label">Tax:</span>
            <span class="total-amount">${formatAmount(taxAmount)}</span>
        </div>
        ` : ''}
        <div class="total-row">
            <span class="total-label">Total:</span>
            <span class="total-amount">${formatAmount(total)}</span>
        </div>
    </div>

    <div class="payment-info">
        <div class="payment-title">Payment Information</div>
        <div class="payment-text">
            Thank you for your business! This invoice was created using Ledgerflow's professional invoicing platform. 
            For full payment processing capabilities and unlimited invoices, upgrade to our Pro plan.
        </div>
    </div>

    <div class="footer">
        <div class="footer-logo">Ledgerflow</div>
        <div class="footer-text">
            This invoice was generated using Ledgerflow's professional invoicing platform.<br>
            Visit <strong>ledgerflow.org</strong> to create your own professional invoices.
        </div>
    </div>
</body>
</html>`;
}