import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { listCustomers } from "@/lib/services/customer-service";
import { listInvoices } from "@/lib/services/invoice-service";
import { listPayments } from "@/lib/services/payment-service";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        defaultWorkspace: true,
        memberships: {
          include: { workspace: true },
          orderBy: { createdAt: "asc" },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const resolvedWorkspaceId =
      session.user.workspaceId ??
      user.defaultWorkspaceId ??
      user.memberships[0]?.workspaceId ??
      null;

    const resolvedWorkspaceName =
      session.user.workspaceName ??
      user.defaultWorkspace?.name ??
      user.memberships[0]?.workspace?.name ??
      null;

    if (!resolvedWorkspaceId) {
      return NextResponse.json({ error: "No workspace found" }, { status: 404 });
    }

    const [invoices, payments, customers] = await Promise.all([
      listInvoices(resolvedWorkspaceId),
      listPayments(resolvedWorkspaceId),
      listCustomers(resolvedWorkspaceId),
    ]);

    return NextResponse.json({
      invoices,
      payments,
      customers,
      user: {
        ...user,
        workspaceId: resolvedWorkspaceId,
        workspaceName: resolvedWorkspaceName,
      },
    });

  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}