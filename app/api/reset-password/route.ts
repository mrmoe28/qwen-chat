import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hash } from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitResponse, RATE_LIMIT_CONFIGS } from "@/lib/rate-limit";

const resetPasswordSchema = z.object({
  token: z.string(),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting: 5 attempts per 15 minutes
    const rateLimitResult = await rateLimit(request, RATE_LIMIT_CONFIGS.auth);
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult.remaining, rateLimitResult.resetAt);
    }

    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    const { token, email, password } = parsed.data;
    const emailLower = email.toLowerCase();

    // Find the verification token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier: emailLower,
          token,
        },
      },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Check if token has expired
    if (verificationToken.expires < new Date()) {
      // Delete the expired token
      await prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: emailLower,
            token,
          },
        },
      });

      return NextResponse.json(
        { error: "Reset token has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: emailLower },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Hash the new password
    const passwordHash = await hash(password, 12);

    // Update user password and delete the verification token in a transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { email: emailLower },
        data: { passwordHash },
      }),
      prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: emailLower,
            token,
          },
        },
      }),
    ]);

    console.log(`Password reset successfully for: ${emailLower}`);

    return NextResponse.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset password failed:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
