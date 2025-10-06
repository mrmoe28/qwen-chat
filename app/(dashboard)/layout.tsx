import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { SubscriptionGate } from "@/components/subscription/subscription-gate";

export const metadata: Metadata = {
  title: "Ledgerflow — Dashboard",
};

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <SubscriptionGate>
      <AppShell>{children}</AppShell>
    </SubscriptionGate>
  );
}
