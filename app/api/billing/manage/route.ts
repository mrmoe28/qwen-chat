import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getSquareClientSync } from "@/lib/square";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action } = await request.json();
    
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const squareClient = getSquareClientSync();
    if (!squareClient) {
      return NextResponse.json({ error: "Square configuration missing" }, { status: 500 });
    }

    switch (action) {
      case "cancel":
        if (!user.subscriptionId) {
          return NextResponse.json({ error: "No active subscription" }, { status: 400 });
        }

        const cancelResponse = await squareClient.subscriptions.cancel({
          subscriptionId: user.subscriptionId
        });

        if (cancelResponse.errors) {
          console.error("Square subscription cancellation errors:", cancelResponse.errors);
          return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 });
        }

        // Update user subscription status
        await prisma.user.update({
          where: { id: user.id },
          data: {
            subscriptionStatus: "canceled",
          },
        });

        return NextResponse.json({ success: true, message: "Subscription canceled" });

      case "reactivate":
        if (!user.subscriptionId) {
          return NextResponse.json({ error: "No subscription to reactivate" }, { status: 400 });
        }

        const resumeResponse = await squareClient.subscriptions.resume({
          subscriptionId: user.subscriptionId
        });

        if (resumeResponse.errors) {
          console.error("Square subscription resume errors:", resumeResponse.errors);
          return NextResponse.json({ error: "Failed to resume subscription" }, { status: 500 });
        }

        await prisma.user.update({
          where: { id: user.id },
          data: {
            subscriptionStatus: "active",
          },
        });

        return NextResponse.json({ success: true, message: "Subscription reactivated" });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

  } catch (error) {
    console.error("Subscription management error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}