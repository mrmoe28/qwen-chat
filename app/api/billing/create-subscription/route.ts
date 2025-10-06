import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getSquareClient, getSquareLocationId } from "@/lib/square";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planVariationId } = await request.json();
    if (!planVariationId) {
      return NextResponse.json({ error: "Plan variation ID required" }, { status: 400 });
    }

    const squareClient = getSquareClient();
    const locationId = getSquareLocationId();
    
    if (!squareClient || !locationId) {
      return NextResponse.json({ error: "Square configuration missing" }, { status: 500 });
    }

    // Find or create Square customer
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let squareCustomerId = user.squareCustomerId;

    if (!squareCustomerId) {
      // Create Square customer
      const customerResponse = await squareClient.customers.createCustomer({
        givenName: user.name?.split(" ")[0] || "Customer",
        familyName: user.name?.split(" ").slice(1).join(" ") || "",
        emailAddress: user.email,
      });

      if (customerResponse.errors) {
        console.error("Square customer creation errors:", customerResponse.errors);
        return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
      }

      squareCustomerId = customerResponse.customer?.id;
      if (!squareCustomerId) {
        return NextResponse.json({ error: "Failed to get customer ID" }, { status: 500 });
      }

      // Update user with Square customer ID
      await prisma.user.update({
        where: { id: user.id },
        data: { squareCustomerId },
      });
    }

    // Create subscription checkout
    const checkoutResponse = await squareClient.checkout.paymentLinks.create({
      orderRequest: {
        order: {
          locationId,
          subscriptionPlanId: planVariationId,
        },
      },
      checkoutOptions: {
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscription=success`,
      },
      prePopulatedData: {
        buyerEmail: user.email,
      },
    });

    if (checkoutResponse.errors) {
      console.error("Square checkout creation errors:", checkoutResponse.errors);
      return NextResponse.json({ error: "Failed to create checkout" }, { status: 500 });
    }

    const paymentLink = checkoutResponse.paymentLink;
    if (!paymentLink?.url) {
      return NextResponse.json({ error: "Failed to create payment link" }, { status: 500 });
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