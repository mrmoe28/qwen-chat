import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function POST() {
  // Require admin authentication
  await requireAdmin();
  try {
    // Check if migration is needed
    const hasColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'User' 
      AND column_name IN ('freeInvoicesUsed', 'freeInvoicesLimit', 'trialStartedAt')
    ` as { column_name: string }[];

    if (hasColumns.length >= 3) {
      return NextResponse.json({ 
        success: true, 
        message: "Migration already applied",
        columns: hasColumns.map((c) => c.column_name)
      });
    }

    // Run the migration
    await prisma.$executeRaw`
      DO $$ 
      BEGIN
          -- Add freeInvoicesUsed column
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'User' AND column_name = 'freeInvoicesUsed') THEN
              ALTER TABLE "User" ADD COLUMN "freeInvoicesUsed" INTEGER NOT NULL DEFAULT 0;
          END IF;
          
          -- Add freeInvoicesLimit column
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'User' AND column_name = 'freeInvoicesLimit') THEN
              ALTER TABLE "User" ADD COLUMN "freeInvoicesLimit" INTEGER NOT NULL DEFAULT 3;
          END IF;
          
          -- Add trialStartedAt column
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'User' AND column_name = 'trialStartedAt') THEN
              ALTER TABLE "User" ADD COLUMN "trialStartedAt" TIMESTAMP(3);
          END IF;
          
          -- Update subscriptionStatus default for trial
          UPDATE "User" SET "subscriptionStatus" = 'trial' 
          WHERE "subscriptionStatus" IS NULL OR "subscriptionStatus" = '';
          
          -- Set trialStartedAt for existing users who don't have it
          UPDATE "User" SET "trialStartedAt" = "createdAt" 
          WHERE "trialStartedAt" IS NULL AND "createdAt" IS NOT NULL;
          
          -- For users without createdAt, set to now
          UPDATE "User" SET "trialStartedAt" = NOW() 
          WHERE "trialStartedAt" IS NULL;
          
      END $$;
    `;

    return NextResponse.json({ 
      success: true, 
      message: "Migration completed successfully" 
    });

  } catch (error) {
    console.error("Migration failed:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Migration failed",
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    );
  }
}