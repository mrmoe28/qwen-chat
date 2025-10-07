import { prisma } from "@/lib/prisma";
import type { InvoiceTemplate } from "@/lib/templates";

export type CreateTemplateData = {
  name: string;
  description: string;
  category: string;
  defaultNotes?: string;
  defaultCurrency: string;
  defaultLineItems: Array<{
    description: string;
    quantity: number;
  }>;
};

export type DatabaseTemplate = {
  id: string;
  name: string;
  description: string;
  category: string;
  defaultNotes: string | null;
  defaultCurrency: string;
  isBuiltIn: boolean;
  workspaceId: string;
  lineItems: Array<{
    id: string;
    description: string;
    quantity: number;
    sortOrder: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
};

export async function createCustomTemplate(
  workspaceId: string,
  data: CreateTemplateData
): Promise<DatabaseTemplate> {
  const template = await prisma.invoiceTemplate.create({
    data: {
      name: data.name,
      description: data.description,
      category: data.category,
      defaultNotes: data.defaultNotes || null,
      defaultCurrency: data.defaultCurrency,
      workspaceId,
      lineItems: {
        create: data.defaultLineItems.map((item, index) => ({
          description: item.description,
          quantity: item.quantity,
          sortOrder: index,
        })),
      },
    },
    include: {
      lineItems: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  return template;
}

export async function getCustomTemplate(
  workspaceId: string,
  templateId: string
): Promise<DatabaseTemplate | null> {
  const template = await prisma.invoiceTemplate.findFirst({
    where: {
      id: templateId,
      workspaceId,
    },
    include: {
      lineItems: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  return template;
}

export async function listCustomTemplates(
  workspaceId: string
): Promise<DatabaseTemplate[]> {
  const templates = await prisma.invoiceTemplate.findMany({
    where: {
      workspaceId,
    },
    include: {
      lineItems: {
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return templates;
}

export async function updateCustomTemplate(
  workspaceId: string,
  templateId: string,
  data: Partial<CreateTemplateData>
): Promise<DatabaseTemplate> {
  // First, delete existing line items if new ones are provided
  if (data.defaultLineItems) {
    await prisma.invoiceTemplateItem.deleteMany({
      where: {
        templateId,
        template: {
          workspaceId,
        },
      },
    });
  }

  const template = await prisma.invoiceTemplate.update({
    where: {
      id: templateId,
      workspaceId,
    },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description && { description: data.description }),
      ...(data.category && { category: data.category }),
      ...(data.defaultNotes !== undefined && { defaultNotes: data.defaultNotes || null }),
      ...(data.defaultCurrency && { defaultCurrency: data.defaultCurrency }),
      ...(data.defaultLineItems && {
        lineItems: {
          create: data.defaultLineItems.map((item, index) => ({
            description: item.description,
            quantity: item.quantity,
            sortOrder: index,
          })),
        },
      }),
    },
    include: {
      lineItems: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  return template;
}

export async function deleteCustomTemplate(
  workspaceId: string,
  templateId: string
): Promise<void> {
  await prisma.invoiceTemplate.delete({
    where: {
      id: templateId,
      workspaceId,
    },
  });
}

export function convertDatabaseTemplateToInvoiceTemplate(
  dbTemplate: DatabaseTemplate
): InvoiceTemplate {
  return {
    id: dbTemplate.id,
    name: dbTemplate.name,
    description: dbTemplate.description,
    defaultCurrency: dbTemplate.defaultCurrency,
    defaultNotes: dbTemplate.defaultNotes || "",
    defaultLineItems: dbTemplate.lineItems.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: 0, // Templates don't store unit prices
    })),
  };
}