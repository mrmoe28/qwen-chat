import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        subscriptionStatus: true,
        subscriptionPlan: true,
        subscriptionId: true,
        subscriptionExpiry: true,
        squareCustomerId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isActive = user.subscriptionStatus === "active";
    const hasExpired = user.subscriptionExpiry ? new Date() > user.subscriptionExpiry : false;

    return NextResponse.json({
      status: user.subscriptionStatus,
      plan: user.subscriptionPlan,
      subscriptionId: user.subscriptionId,
      expiry: user.subscriptionExpiry,
      isActive: isActive && !hasExpired,
      hasSquareCustomer: !!user.squareCustomerId,
    });

  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}