export type InvoiceTemplate = {
  id: string;
  name: string;
  description: string;
  defaultLineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  defaultNotes: string;
  defaultCurrency: string;
};

export const templates: Record<string, InvoiceTemplate> = {
  "standard-invoice": {
    id: "standard-invoice",
    name: "Standard Invoice",
    description: "A clean, professional invoice template suitable for most businesses",
    defaultLineItems: [
      {
        description: "Professional Services",
        quantity: 1,
        unitPrice: 0,
      },
    ],
    defaultNotes: "Thank you for your business! Payment is due within 30 days.",
    defaultCurrency: "USD",
  },
  "service-invoice": {
    id: "service-invoice", 
    name: "Service Invoice",
    description: "Perfect for consultants, freelancers, and service-based businesses",
    defaultLineItems: [
      {
        description: "Consulting Services - Project Strategy",
        quantity: 1,
        unitPrice: 0,
      },
      {
        description: "Implementation & Development",
        quantity: 1,
        unitPrice: 0,
      },
    ],
    defaultNotes: "Payment terms: Net 15 days. All services performed professionally and to specification.",
    defaultCurrency: "USD",
  },
  "product-invoice": {
    id: "product-invoice",
    name: "Product Invoice", 
    description: "Optimized for businesses selling physical products",
    defaultLineItems: [
      {
        description: "Wireless Laptop Stand - Aluminum, Height Adjustable",
        quantity: 1,
        unitPrice: 0,
      },
      {
        description: "Mechanical Keyboard - RGB Backlit, Cherry MX Blue",
        quantity: 1,
        unitPrice: 0,
      },
      {
        description: "Wireless Gaming Mouse - 12000 DPI, Ergonomic",
        quantity: 1,
        unitPrice: 0,
      },
    ],
    defaultNotes: "Thank you for your order! All products come with manufacturer warranty. Shipping included.",
    defaultCurrency: "USD",
  },
  "recurring-invoice": {
    id: "recurring-invoice",
    name: "Recurring Invoice",
    description: "Ideal for subscription services and recurring billing",
    defaultLineItems: [
      {
        description: "Monthly Subscription - Premium Plan",
        quantity: 1,
        unitPrice: 0,
      },
    ],
    defaultNotes: "This is a recurring monthly charge. Next billing date: [Next Month]. Cancel anytime.",
    defaultCurrency: "USD",
  },
  "deposit-invoice": {
    id: "deposit-invoice",
    name: "Deposit Invoice",
    description: "For projects requiring upfront deposits or partial payments",
    defaultLineItems: [
      {
        description: "Project Deposit - Website Development",
        quantity: 1,
        unitPrice: 0,
      },
    ],
    defaultNotes: "50% deposit required to begin project. Remaining balance due upon completion.",
    defaultCurrency: "USD",
  },
  "minimal-invoice": {
    id: "minimal-invoice",
    name: "Minimal Invoice",
    description: "A simple, clean template with just the essentials",
    defaultLineItems: [
      {
        description: "Service Fee",
        quantity: 1,
        unitPrice: 0,
      },
    ],
    defaultNotes: "Payment due upon receipt.",
    defaultCurrency: "USD",
  },
};

import { getCustomTemplate, convertDatabaseTemplateToInvoiceTemplate } from "@/lib/services/template-service";

export async function getTemplate(templateId: string, workspaceId?: string): Promise<InvoiceTemplate | null> {
  // Check built-in templates first
  if (templates[templateId]) {
    return templates[templateId];
  }

  // Check for custom templates in database (server-side)
  if (workspaceId && !templates[templateId]) {
    try {
      const dbTemplate = await getCustomTemplate(workspaceId, templateId);
      if (dbTemplate) {
        return convertDatabaseTemplateToInvoiceTemplate(dbTemplate);
      }
    } catch (error) {
      console.error('Error fetching custom template:', error);
    }
  }

  return null;
}

// Synchronous version for built-in templates only
export function getBuiltInTemplate(templateId: string): InvoiceTemplate | null {
  return templates[templateId] || null;
}