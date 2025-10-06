import type { Invoice, InvoiceLine } from "@prisma/client";
import { randomUUID } from "crypto";

import { getSquareClient, getSquareLocationId } from "@/lib/square";
import { buildEmailUrl } from "@/lib/utils/email-helpers";

function getSquarePaymentSuccessUrl(invoiceId: string): string {
  // For Square checkout, we need a publicly accessible URL
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL_URL) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
                   'https://ledgerflow.org';
    return `${baseUrl}/payment-success?invoice=${invoiceId}`;
  }
  
  // In development
  const devUrl = process.env.STRIPE_REDIRECT_BASE_URL || buildEmailUrl('payment-success');
  return `${devUrl}${devUrl.includes('?') ? '&' : '?'}invoice=${invoiceId}`;
}

export async function maybeCreateSquarePaymentLink(invoice: Invoice & { lineItems: InvoiceLine[] }) {
  console.log('🟦 Attempting to create Square payment link for invoice:', invoice.number);
  
  // Validate invoice data before attempting Square integration
  if (!invoice.lineItems || invoice.lineItems.length === 0) {
    const error = 'Cannot create Square payment link: Invoice has no line items';
    console.error('❌', error);
    return null;
  }

  if (!invoice.total || Number(invoice.total) <= 0) {
    const error = 'Cannot create Square payment link: Invoice total is zero or negative';
    console.error('❌', error);
    return null;
  }

  if (!invoice.currency || invoice.currency.toUpperCase() !== 'USD') {
    const error = 'Cannot create Square payment link: Square only supports USD currency';
    console.error('❌', error);
    return null;
  }
  
  const squareClient = getSquareClient();
  const locationId = getSquareLocationId();
  
  if (!squareClient) {
    const error = 'Square client not available - check SQUARE_ACCESS_TOKEN and SQUARE_APPLICATION_ID environment variables';
    console.error('❌', error);
    return null;
  }

  if (!locationId) {
    const error = 'Square location ID not configured - check SQUARE_LOCATION_ID environment variable';
    console.error('❌', error);
    return null;
  }

  console.log('✅ Square client initialized and invoice validation passed');

  try {
    const depositEnabled = Boolean(
      invoice.requiresDeposit && invoice.depositAmount && Number(invoice.depositAmount) > 0,
    );

    // Convert line items to Square format
    const orderLineItems = depositEnabled
      ? [
          {
            name: `Deposit for ${invoice.number}`,
            quantity: "1",
            itemType: "ITEM",
            basePriceMoney: {
              amount: Math.round(Number(invoice.depositAmount) * 100), // Convert to cents
              currency: "USD"
            }
          }
        ]
      : invoice.lineItems.map((item) => ({
          name: item.description,
          quantity: item.quantity.toString(),
          itemType: "ITEM" as const,
          basePriceMoney: {
            amount: Math.round(Number(item.unitPrice) * 100), // Convert to cents
            currency: "USD"
          }
        }));

    // Create the order first
    const { checkoutApi } = squareClient;
    const successUrl = getSquarePaymentSuccessUrl(invoice.id);
    
    console.log('📝 Creating Square checkout with data:', {
      lineItemsCount: orderLineItems.length,
      currency: invoice.currency,
      total: invoice.total,
      depositEnabled,
      successUrl,
      locationId
    });

    const requestBody = {
      idempotencyKey: randomUUID(),
      order: {
        locationId: locationId,
        lineItems: orderLineItems,
        metadata: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.number,
          requiresDeposit: depositEnabled ? "true" : "false",
          ...(depositEnabled && invoice.depositAmount
            ? { depositAmount: String(Number(invoice.depositAmount)) }
            : {}),
          ...(depositEnabled && invoice.depositType ? { depositType: invoice.depositType } : {}),
        }
      },
      checkoutOptions: {
        redirectUrl: successUrl,
        askForShippingAddress: false,
      },
      prePopulatedData: {
        buyerEmail: invoice.customer?.email || undefined,
      }
    };

    const response = await checkoutApi.createPaymentLink(requestBody);

    if (response.result && response.result.paymentLink && response.result.paymentLink.url) {
      const paymentLinkUrl = response.result.paymentLink.url;
      console.log('✅ Square payment link created successfully:', paymentLinkUrl);
      console.log('✅ Link order ID:', response.result.paymentLink.orderId);
      return paymentLinkUrl;
    } else {
      const error = 'Invalid payment link returned from Square';
      console.error('❌', error, response.result);
      return null;
    }
  } catch (error) {
    console.error("❌ Failed to create Square payment link for invoice:", invoice.number);
    
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Log specific Square errors for better debugging
      if (error.message.includes('UNAUTHORIZED')) {
        console.error('🔑 Square API authentication issue - check SQUARE_ACCESS_TOKEN');
      } else if (error.message.includes('location')) {
        console.error('📍 Square location issue - check SQUARE_LOCATION_ID');
      } else if (error.message.includes('currency')) {
        console.error('💱 Currency validation issue - Square only supports USD');
      } else if (error.message.includes('amount')) {
        console.error('💰 Amount validation issue - check line item amounts');
      }
    }
    
    // Log invoice details for debugging
    console.error('Invoice details for debugging:', {
      id: invoice.id,
      number: invoice.number,
      total: invoice.total,
      currency: invoice.currency,
      lineItemCount: invoice.lineItems.length,
      hasDeposit: Boolean(invoice.requiresDeposit && invoice.depositAmount)
    });
    
    return null;
  }
}