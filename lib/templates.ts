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
        quantity: 8,
        unitPrice: 150,
      },
      {
        description: "Implementation & Development",
        quantity: 24,
        unitPrice: 125,
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
        quantity: 25,
        unitPrice: 89.99,
      },
      {
        description: "Mechanical Keyboard - RGB Backlit, Cherry MX Blue",
        quantity: 15,
        unitPrice: 129.99,
      },
      {
        description: "Wireless Gaming Mouse - 12000 DPI, Ergonomic",
        quantity: 30,
        unitPrice: 79.99,
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
        unitPrice: 99.99,
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
        unitPrice: 2500,
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

export function getTemplate(templateId: string): InvoiceTemplate | null {
  return templates[templateId] || null;
}