import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/services/notification-service';
import { buildEmailUrl } from '@/lib/utils/email-helpers';

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


function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function buildGuestInvoiceEmailHtml(invoice: GuestInvoice): string {
  const totalAmount = invoice.amount / 100;
  const invoiceUrl = buildEmailUrl(`guest/invoice/${invoice.id}`);
  
  const itemsHtml = invoice.items.map(item => `
    <tr style="border-bottom: 1px solid #f3f4f6;">
      <td style="padding: 12px 0; font-size: 14px; color: #374151;">${item.description}</td>
      <td style="padding: 12px 0; font-size: 14px; color: #374151; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px 0; font-size: 14px; color: #374151; text-align: right;">$${(item.rate / 100).toFixed(2)}</td>
      <td style="padding: 12px 0; font-size: 14px; color: #374151; text-align: right;">$${(item.amount / 100).toFixed(2)}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoice.invoiceNumber} from Ledgerflow</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
  <div style="padding: 40px 0;">
    <table cellpadding="0" cellspacing="0" style="margin: 0 auto; max-width: 600px; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <!-- Header -->
      <tr>
        <td style="background-color: #0f172a; padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Ledgerflow</h1>
          <p style="color: #cbd5e1; margin: 8px 0 0 0; font-size: 14px;">Professional Invoicing</p>
        </td>
      </tr>
      
      <!-- Main Content -->
      <tr>
        <td style="padding: 32px;">
          <p style="font-size: 16px; line-height: 24px; color: #374151; margin-bottom: 24px;">
            Hi ${invoice.customerName},
          </p>
          
          <p style="font-size: 16px; line-height: 24px; color: #374151; margin-bottom: 32px;">
            Thank you for your business. Please find your invoice details below.
          </p>

          <!-- Invoice Summary -->
          <div style="background-color: #f3f4f6; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
            <table style="width: 100%;">
              <tr>
                <td style="padding-bottom: 12px;">
                  <strong style="color: #6b7280; font-size: 12px; text-transform: uppercase;">Invoice Number</strong>
                  <div style="color: #111827; font-size: 16px; margin-top: 4px;">${invoice.invoiceNumber}</div>
                </td>
                <td style="padding-bottom: 12px; text-align: right;">
                  <strong style="color: #6b7280; font-size: 12px; text-transform: uppercase;">Amount Due</strong>
                  <div style="color: #111827; font-size: 20px; font-weight: 600; margin-top: 4px;">
                    $${totalAmount.toFixed(2)}
                  </div>
                </td>
              </tr>
              <tr>
                <td>
                  <strong style="color: #6b7280; font-size: 12px; text-transform: uppercase;">Invoice Date</strong>
                  <div style="color: #111827; font-size: 14px; margin-top: 4px;">${formatDate(invoice.createdAt)}</div>
                </td>
                <td style="text-align: right;">
                  <strong style="color: #6b7280; font-size: 12px; text-transform: uppercase;">Due Date</strong>
                  <div style="color: #111827; font-size: 14px; margin-top: 4px;">${formatDate(invoice.dueDate)}</div>
                </td>
              </tr>
            </table>
          </div>

          <!-- Line Items -->
          <div style="margin-bottom: 32px;">
            <h3 style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 16px; text-transform: uppercase;">Invoice Items</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <th style="text-align: left; padding: 8px 0; font-size: 12px; color: #6b7280; font-weight: 500;">Description</th>
                  <th style="text-align: center; padding: 8px 0; font-size: 12px; color: #6b7280; font-weight: 500;">Qty</th>
                  <th style="text-align: right; padding: 8px 0; font-size: 12px; color: #6b7280; font-weight: 500;">Price</th>
                  <th style="text-align: right; padding: 8px 0; font-size: 12px; color: #6b7280; font-weight: 500;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr style="border-top: 2px solid #e5e7eb;">
                  <td colspan="3" style="padding: 12px 0; font-size: 16px; font-weight: 600; color: #111827; text-align: right;">Total Due</td>
                  <td style="padding: 12px 0; font-size: 16px; font-weight: 600; color: #111827; text-align: right;">$${totalAmount.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- View Invoice Button -->
          <div style="text-align: center; margin-bottom: 32px;">
            <a href="${invoiceUrl}" 
               target="_blank" 
               rel="noopener nofollow"
               role="button"
               aria-label="View Invoice ${invoice.invoiceNumber}"
               style="display: inline-block; background-color: #3b82f6; color: white !important; padding: 16px 32px; border-radius: 6px; text-decoration: none; font-size: 16px; font-weight: 600; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 2px solid #3b82f6; mso-padding-alt: 16px 32px; mso-text-raise: 4px;">
              <!--[if mso]>
              <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="height:54px;v-text-anchor:middle;width:200px;">
                <v:fill type="tile" color="#3b82f6" />
                <v:textbox inset="0,0,0,0">
              <![endif]-->
              <span style="color: white !important; text-decoration: none;">View Invoice</span>
              <!--[if mso]>
                </v:textbox>
              </v:rect>
              <![endif]-->
            </a>
          </div>

          <!-- Alternative Link -->
          <div style="background-color: #f9fafb; border-radius: 6px; padding: 16px; margin-bottom: 24px; border: 1px solid #e5e7eb;">
            <p style="font-size: 12px; color: #6b7280; margin: 0 0 8px 0; font-weight: 500;">
              Having trouble with the button above? Copy and paste this link:
            </p>
            <p style="font-size: 12px; color: #3b82f6; word-break: break-all; margin: 0; padding: 8px; background-color: white; border-radius: 4px; border: 1px solid #d1d5db;">
              <a href="${invoiceUrl}" target="_blank" rel="noopener nofollow" style="color: #3b82f6; text-decoration: none;">${invoiceUrl}</a>
            </p>
          </div>

          <!-- Trial Notice -->
          <div style="background-color: #fef3c7; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
            <p style="font-size: 14px; color: #92400e; margin: 0;">
              <strong>💡 Trial Invoice:</strong> This invoice was created using Ledgerflow's free trial. 
              <a href="${buildEmailUrl('sign-up')}" style="color: #92400e; text-decoration: underline;">Sign up</a> for unlimited professional invoices with payment processing.
            </p>
          </div>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background-color: #f9fafb; padding: 24px; border-top: 1px solid #e5e7eb;">
          <table style="width: 100%;">
            <tr>
              <td>
                <p style="font-size: 12px; color: #6b7280; margin: 0 0 4px 0;">
                  <strong>Ledgerflow</strong>
                </p>
                <p style="font-size: 12px; color: #6b7280; margin: 0;">
                  Professional Invoicing Made Simple
                </p>
              </td>
              <td style="text-align: right;">
                <p style="font-size: 12px; color: #9ca3af; margin: 0;">
                  Questions? Contact support
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}

function buildGuestInvoiceEmailText(invoice: GuestInvoice): string {
  const totalAmount = invoice.amount / 100;
  const invoiceUrl = buildEmailUrl(`guest/invoice/${invoice.id}`);

  return `Invoice ${invoice.invoiceNumber} from Ledgerflow

Dear ${invoice.customerName},

Thank you for your business. We have prepared an invoice for $${totalAmount.toFixed(2)} due on ${formatDate(invoice.dueDate)}.

Please review the invoice details and submit payment at your convenience.

View Invoice: ${invoiceUrl}

Questions about this invoice? Please contact us for assistance.

Best regards,
Ledgerflow Team

---
This is a trial invoice created with Ledgerflow's free plan.
Sign up at ${buildEmailUrl('sign-up')} for unlimited professional invoices with payment processing.`;
}

export async function POST(request: NextRequest) {
  try {
    const { invoice }: { invoice: GuestInvoice } = await request.json();

    if (!invoice || !invoice.customerEmail) {
      return NextResponse.json(
        { error: 'Invoice and customer email are required' },
        { status: 400 }
      );
    }

    const html = buildGuestInvoiceEmailHtml(invoice);
    const text = buildGuestInvoiceEmailText(invoice);
    const subject = `Invoice ${invoice.invoiceNumber} from Ledgerflow`;

    const response = await sendEmail({
      to: invoice.customerEmail,
      subject,
      html,
      text,
    });

    if (response.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: response.error || 'Failed to send email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Guest invoice email error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}