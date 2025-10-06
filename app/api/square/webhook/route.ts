import { headers } from "next/headers";
import { NextResponse } from "next/server";
import crypto from "crypto";

import { prisma } from "@/lib/prisma";
import { notifyInvoicePaid } from "@/lib/services/invoice-notification-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const webhookSecret = process.env.SQUARE_WEBHOOK_SECRET;
  const appId = process.env.SQUARE_APPLICATION_ID;

  if (!webhookSecret || !appId) {
    console.error("Missing Square configuration - check SQUARE_WEBHOOK_SECRET and SQUARE_APPLICATION_ID");
    return NextResponse.json({ received: true });
  }

  // Get raw body as text for signature verification
  const payload = await request.text();
  const signature = (await headers()).get("x-square-hmacsha256-signature");

  if (!signature) {
    console.error("Missing Square signature header");
    return NextResponse.json({ message: "Missing signature" }, { status: 400 });
  }

  try {
    // Verify Square webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(payload)
      .digest("base64");

    if (signature !== expectedSignature) {
      console.error("Square webhook signature verification failed");
      return NextResponse.json({ message: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(payload);
    console.log(`🔗 Received Square webhook: ${event.type}`);

    switch (event.type) {
      case "payment.created": {
        const payment = event.data.object;
        console.log("✅ Processing payment.created", payment.id);
        
        let invoiceId = null;
        
        // Try to get invoice ID from different sources
        if (payment && payment.reference_id) {
          invoiceId = payment.reference_id;
        } else if (payment && payment.note) {
          // Try to extract invoice number from payment note
          const match = payment.note.match(/Invoice:\s*([A-Z0-9-]+)/i);
          if (match) {
            const invoiceNumber = match[1];
            // Find invoice by number
            const invoice = await prisma.invoice.findFirst({
              where: { number: invoiceNumber },
              select: { id: true }
            });
            if (invoice) {
              invoiceId = invoice.id;
            }
          }
        }
        
        if (invoiceId) {
          
          console.log(`💰 Marking invoice ${invoiceId} as PAID from Square payment`);
          
          // Update invoice status to PAID
          const invoice = await prisma.invoice.update({
            where: { id: invoiceId },
            data: { status: "PAID" },
            include: { customer: true, workspace: true }
          });
          
          // Create or update payment record
          await prisma.payment.upsert({
            where: { 
              invoiceId_squarePaymentId: {
                invoiceId: invoiceId,
                squarePaymentId: payment.id
              }
            },
            update: {
              status: "SUCCEEDED",
              processedAt: new Date(),
              rawPayload: payment,
            },
            create: {
              invoiceId: invoiceId,
              amount: payment.amount_money ? (payment.amount_money.amount / 100) : 0,
              currency: payment.amount_money?.currency || "USD",
              status: "SUCCEEDED",
              processedAt: new Date(),
              squarePaymentId: payment.id,
              rawPayload: payment,
            }
          });
          
          // Send notification
          await notifyInvoicePaid(invoice.id);
          console.log(`✅ Invoice ${invoiceId} marked as PAID and notification sent`);
        } else {
          console.warn("No reference_id found in Square payment");
        }
        break;
      }
      case "payment.updated": {
        const payment = event.data.object;
        console.log("🔄 Processing payment.updated", payment.id);
        
        let invoiceId = null;
        
        // Try to get invoice ID from different sources
        if (payment && payment.reference_id) {
          invoiceId = payment.reference_id;
        } else if (payment && payment.note) {
          // Try to extract invoice number from payment note
          const match = payment.note.match(/Invoice:\s*([A-Z0-9-]+)/i);
          if (match) {
            const invoiceNumber = match[1];
            // Find invoice by number
            const invoice = await prisma.invoice.findFirst({
              where: { number: invoiceNumber },
              select: { id: true }
            });
            if (invoice) {
              invoiceId = invoice.id;
            }
          }
        }
        
        if (invoiceId) {
          
          // Update payment record with new status
          const existingPayment = await prisma.payment.findUnique({
            where: { squarePaymentId: payment.id }
          });
          
          if (existingPayment) {
            await prisma.payment.update({
              where: { id: existingPayment.id },
              data: {
                status: payment.status === "COMPLETED" ? "SUCCEEDED" : "FAILED",
                processedAt: new Date(),
                rawPayload: payment,
              },
            });
            
            // If payment completed, mark invoice as paid
            if (payment.status === "COMPLETED") {
              const invoice = await prisma.invoice.update({
                where: { id: invoiceId },
                data: { status: "PAID" },
              });
              
              await notifyInvoicePaid(invoice.id);
              console.log(`✅ Invoice ${invoiceId} marked as PAID via payment update`);
            }
          }
        }
        break;
      }
      case "payment.failed": {
        const payment = event.data.object;
        console.log("❌ Processing payment.failed", payment.id);
        
        if (payment && payment.id) {
          await prisma.payment.updateMany({
            where: { squarePaymentId: payment.id },
            data: { status: "FAILED" },
          });
          console.log(`❌ Square payment ${payment.id} marked as FAILED`);
        }
        break;
      }
      case "order.created": {
        const order = event.data.object;
        console.log("📋 Processing order.created", order.id);
        
        if (order && order.reference_id) {
          console.log(`📋 Order created for invoice ${order.reference_id}`);
          // Optionally handle order creation
        }
        break;
      }
      case "order.updated": {
        const order = event.data.object;
        console.log("📋 Processing order.updated", order.id);
        
        if (order && order.state === "COMPLETED" && order.reference_id) {
          const invoiceId = order.reference_id;
          console.log(`✅ Order completed for invoice ${invoiceId}`);
          
          // Update invoice status if order is completed
          const invoice = await prisma.invoice.update({
            where: { id: invoiceId },
            data: { status: "PAID" },
            include: { customer: true, workspace: true }
          });
          
          await notifyInvoicePaid(invoice.id);
          console.log(`✅ Invoice ${invoiceId} marked as PAID via order completion`);
        }
        break;
      }
      default:
        console.log(`🔍 Unhandled Square webhook event type: ${event.type}`);
        break;
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("❌ Square webhook error:", error);
    
    if (error instanceof Error) {
      console.error("Error message:", error.message);
    }
    
    return NextResponse.json({ 
      message: "Webhook processing failed",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 400 });
  }
}