import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        subscriptionStatus: true,
        freeInvoicesUsed: true,
        freeInvoicesLimit: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only track usage for trial users
    if (user.subscriptionStatus === "trial") {
      const newUsageCount = (user.freeInvoicesUsed || 0) + 1;
      const limit = user.freeInvoicesLimit || 3;

      await prisma.user.update({
        where: { id: user.id },
        data: { 
          freeInvoicesUsed: newUsageCount,
          // Automatically transition to expired trial when limit reached
          ...(newUsageCount >= limit && { subscriptionStatus: "trial_expired" })
        },
      });

      return NextResponse.json({
        success: true,
        freeInvoicesUsed: newUsageCount,
        freeInvoicesRemaining: Math.max(0, limit - newUsageCount),
        trialExpired: newUsageCount >= limit,
      });
    }

    // For active subscribers, no tracking needed
    return NextResponse.json({
      success: true,
      unlimited: true,
    });

  } catch (error) {
    console.error("Usage tracking error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}