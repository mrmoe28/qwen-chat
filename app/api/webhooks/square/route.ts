import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

function verifySquareWebhook(requestBody: string, signature: string, webhookSecret: string): boolean {
  try {
    const hmac = crypto.createHmac("sha256", webhookSecret);
    hmac.update(requestBody);
    const expectedSignature = hmac.digest("base64");
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  } catch (error) {
    console.error("Webhook verification error:", error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-square-hmacsha256-signature");
    const webhookSecret = process.env.SQUARE_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      console.error("Missing webhook signature or secret");
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    // Verify webhook signature
    if (!verifySquareWebhook(body, signature, webhookSecret)) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);
    const eventType = event.type;

    console.log("Square webhook received:", eventType);

    switch (eventType) {
      case "subscription.created":
      case "subscription.updated":
        await handleSubscriptionEvent(event);
        break;
      
      case "invoice.payment_made":
        await handlePaymentEvent(event);
        break;

      default:
        console.log("Unhandled Square webhook event:", eventType);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error("Square webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

interface SquareSubscription {
  customer_id?: string;
  id?: string;
  status?: string;
  plan_variation_id?: string;
  charged_through_date?: string;
}

async function handleSubscriptionEvent(event: { data?: { object?: { subscription?: SquareSubscription } } }) {
  try {
    const subscription = event.data?.object?.subscription;
    if (!subscription) {
      console.error("No subscription data in event");
      return;
    }

    const customerId = subscription.customer_id;
    const subscriptionId = subscription.id;
    const status = subscription.status?.toLowerCase() || "none";
    const planVariationId = subscription.plan_variation_id;

    if (!customerId) {
      console.error("No customer ID in subscription event");
      return;
    }

    // Find user by Square customer ID
    const user = await prisma.user.findFirst({
      where: { squareCustomerId: customerId },
    });

    if (!user) {
      console.error("User not found for Square customer ID:", customerId);
      return;
    }

    // Update user subscription status
    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionId,
        subscriptionPlan: planVariationId,
        subscriptionStatus: status,
        subscriptionExpiry: subscription.charged_through_date ? new Date(subscription.charged_through_date) : null,
      },
    });

    console.log("Updated user subscription:", user.email, status);

  } catch (error) {
    console.error("Error handling subscription event:", error);
  }
}

interface SquareInvoice {
  primary_recipient?: {
    customer_id?: string;
  };
}

async function handlePaymentEvent(event: { data?: { object?: { invoice?: SquareInvoice } } }) {
  try {
    const invoice = event.data?.object?.invoice;
    if (!invoice) {
      console.error("No invoice data in payment event");
      return;
    }

    const customerId = invoice.primary_recipient?.customer_id;
    if (!customerId) {
      console.error("No customer ID in payment event");
      return;
    }

    // Find user by Square customer ID
    const user = await prisma.user.findFirst({
      where: { squareCustomerId: customerId },
    });

    if (!user) {
      console.error("User not found for Square customer ID:", customerId);
      return;
    }

    // Mark subscription as active when payment is successful
    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionStatus: "active",
      },
    });

    console.log("Updated user subscription to active after payment:", user.email);

  } catch (error) {
    console.error("Error handling payment event:", error);
  }
}