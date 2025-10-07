"use client";

import * as React from "react";
import { Icon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { GuestEmailService, type EmailResult } from "@/lib/services/guest-email-service";
import { GuestService } from "@/lib/services/guest-service";

const successCopy = "Invoice sent";
const errorCopy = "Send failed";

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

type Props = {
  invoice: GuestInvoice;
  onStatusChange?: () => void;
  disabled?: boolean;
};

export function SendGuestInvoiceButton({ invoice, onStatusChange, disabled }: Props) {
  const [message, setMessage] = React.useState<string | null>(null);
  const [isPending, setIsPending] = React.useState(false);

  const handleSend = async () => {
    if (!invoice.customerEmail) {
      setMessage("Customer email is required");
      return;
    }

    setIsPending(true);
    setMessage(null);

    try {
      const result: EmailResult = await GuestEmailService.sendGuestInvoice(invoice);
      
      if (result.success) {
        setMessage(successCopy);
        // Update the invoice status to 'sent' in localStorage
        GuestService.updateInvoice(invoice.id, { status: 'sent' });
        // Notify parent component of status change
        if (onStatusChange) {
          onStatusChange();
        }
      } else {
        setMessage(result.error || errorCopy);
      }
    } catch (error) {
      console.error('Failed to send guest invoice:', error);
      setMessage(errorCopy);
    } finally {
      setIsPending(false);
    }
  };

  const canSend = invoice.customerEmail && !disabled;

  return (
    <div className="flex items-center gap-3">
      <Button
        type="button"
        size="sm"
        className="gap-2"
        onClick={handleSend}
        disabled={isPending || !canSend}
      >
        {isPending ? (
          <Icon name="loader" className="size-4 animate-spin" />
        ) : (
          <Icon name="send" className="size-4" />
        )}
        {isPending ? "Sending" : "Send Invoice"}
      </Button>
      {message && (
        <span className={`text-xs ${message === successCopy ? 'text-green-600' : 'text-red-600'}`}>
          {message}
        </span>
      )}
      {!invoice.customerEmail && (
        <span className="text-xs text-muted-foreground">
          Customer email required
        </span>
      )}
    </div>
  );
}