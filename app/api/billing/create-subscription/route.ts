import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomUUID } from "crypto";
import { getSquareClientSync, getSquareLocationIdSync } from "@/lib/square";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await request.json(); // Parse request body but don't need planVariationId

    // Fast configuration check
    const squareClient = getSquareClientSync();
    const locationId = getSquareLocationIdSync();
    
    if (!squareClient || !locationId) {
      return NextResponse.json({ error: "Square configuration missing" }, { status: 500 });
    }

    // Quick user lookup with minimal fields
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        squareCustomerId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create payment link immediately - customer creation can happen async
    const checkoutResponse = await squareClient.checkout.paymentLinks.create({
      idempotencyKey: randomUUID(),
      quickPay: {
        name: `Pro Subscription - $29.99/month`,
        priceMoney: {
          amount: BigInt(2999), // $29.99 in cents
          currency: 'USD'
        },
        locationId: locationId
      },
      paymentNote: `Ledgerflow Pro Subscription`,
      checkoutOptions: {
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscription=success`,
        allowTipping: false,
        askForShippingAddress: false,
      }
    });

    if (checkoutResponse.errors) {
      console.error("Square checkout creation errors:", checkoutResponse.errors);
      return NextResponse.json({ error: "Failed to create checkout" }, { status: 500 });
    }

    const paymentLink = checkoutResponse.paymentLink;
    if (!paymentLink?.url) {
      return NextResponse.json({ error: "Failed to create payment link" }, { status: 500 });
    }

    // Async customer creation in background if needed (don't await)
    if (!user.squareCustomerId) {
      squareClient.customers.create({
        givenName: user.name?.split(" ")[0] || "Customer",
        familyName: user.name?.split(" ").slice(1).join(" ") || "",
        emailAddress: user.email,
      }).then(async (customerResponse) => {
        if (!customerResponse.errors && customerResponse.customer?.id) {
          await prisma.user.update({
            where: { id: user.id },
            data: { squareCustomerId: customerResponse.customer.id },
          });
        }
      }).catch(error => {
        console.error("Background Square customer creation failed:", error);
      });
    }

    return NextResponse.json({
      checkoutUrl: paymentLink.url,
      paymentLinkId: paymentLink.id,
    });

  } catch (error) {
    console.error("Subscription creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}