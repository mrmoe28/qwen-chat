
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

export interface EmailResult {
  success: boolean;
  error?: string;
}

export class GuestEmailService {
  static async sendGuestInvoice(invoice: GuestInvoice): Promise<EmailResult> {
    if (!invoice.customerEmail) {
      return { success: false, error: "Customer email is required" };
    }

    try {
      const response = await fetch('/api/guest/send-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoice,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error || 'Failed to send email' };
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to send guest invoice email:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }
}