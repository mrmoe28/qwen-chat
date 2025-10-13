import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "crypto";

import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/services/notification-service";
import { buildEmailUrl } from "@/lib/utils/email-helpers";
import { rateLimit, rateLimitResponse, RATE_LIMIT_CONFIGS } from "@/lib/rate-limit";

const requestSchema = z.object({
  email: z.string().email(),
});

// Token expires in 1 hour
const TOKEN_EXPIRY_HOURS = 1;

function buildResetPasswordEmailHtml(resetUrl: string, userName: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - Ledgerflow</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
  <div style="padding: 40px 0;">
    <table cellpadding="0" cellspacing="0" style="margin: 0 auto; max-width: 600px; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <!-- Header -->
      <tr>
        <td style="background-color: #0f172a; padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Ledgerflow</h1>
          <p style="color: #cbd5e1; margin: 8px 0 0 0; font-size: 14px;">Professional Invoicing</p>
        </td>
      </tr>

      <!-- Main Content -->
      <tr>
        <td style="padding: 32px;">
          <h2 style="font-size: 20px; color: #111827; margin: 0 0 16px 0;">Reset Your Password</h2>

          <p style="font-size: 16px; line-height: 24px; color: #374151; margin-bottom: 24px;">
            Hi${userName ? ` ${userName}` : ''},
          </p>

          <p style="font-size: 16px; line-height: 24px; color: #374151; margin-bottom: 24px;">
            We received a request to reset your password. Click the button below to create a new password.
          </p>

          <!-- Reset Password Button -->
          <div style="text-align: center; margin-bottom: 32px;">
            <a href="${resetUrl}"
               target="_blank"
               rel="noopener"
               role="button"
               aria-label="Reset Password"
               style="display: inline-block; background-color: #3b82f6; color: white !important; padding: 16px 32px; border-radius: 6px; text-decoration: none; font-size: 16px; font-weight: 600; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 2px solid #3b82f6;">
              <span style="color: white !important; text-decoration: none;">Reset Password</span>
            </a>
          </div>

          <!-- Alternative Link -->
          <div style="background-color: #f9fafb; border-radius: 6px; padding: 16px; margin-bottom: 24px; border: 1px solid #e5e7eb;">
            <p style="font-size: 12px; color: #6b7280; margin: 0 0 8px 0; font-weight: 500;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style="font-size: 12px; color: #3b82f6; word-break: break-all; margin: 0; padding: 8px; background-color: white; border-radius: 4px; border: 1px solid #d1d5db;">
              <a href="${resetUrl}" target="_blank" rel="noopener" style="color: #3b82f6; text-decoration: none;">${resetUrl}</a>
            </p>
          </div>

          <!-- Security Notice -->
          <div style="background-color: #fef3c7; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
            <p style="font-size: 14px; color: #92400e; margin: 0;">
              <strong>⚠️ Security Notice:</strong> This link will expire in ${TOKEN_EXPIRY_HOURS} hour${TOKEN_EXPIRY_HOURS > 1 ? 's' : ''}.
              If you didn't request a password reset, you can safely ignore this email.
            </p>
          </div>

          <p style="font-size: 14px; color: #6b7280; margin-bottom: 0;">
            If you have any questions, please contact our support team.
          </p>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background-color: #f9fafb; padding: 24px; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #6b7280; margin: 0; text-align: center;">
            <strong>Ledgerflow</strong> - Professional Invoicing Made Simple
          </p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}

function buildResetPasswordEmailText(resetUrl: string, userName: string): string {
  return `Reset Your Password - Ledgerflow

Hi${userName ? ` ${userName}` : ''},

We received a request to reset your password. Click the link below to create a new password:

${resetUrl}

This link will expire in ${TOKEN_EXPIRY_HOURS} hour${TOKEN_EXPIRY_HOURS > 1 ? 's' : ''}.

If you didn't request a password reset, you can safely ignore this email.

Best regards,
Ledgerflow Team`;
}

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting: 3 attempts per hour
    const rateLimitResult = await rateLimit(request, RATE_LIMIT_CONFIGS.passwordReset);
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult.remaining, rateLimitResult.resetAt);
    }

    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const email = parsed.data.email.toLowerCase();

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return success for security reasons (don't reveal if email exists)
    if (!user) {
      return NextResponse.json({ success: true });
    }

    // Generate a secure reset token
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    // Delete any existing reset tokens for this user
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    // Store the new token
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    });

    // Build the reset URL
    const resetUrl = buildEmailUrl(`reset-password?token=${token}&email=${encodeURIComponent(email)}`);

    // Send the reset email
    const html = buildResetPasswordEmailHtml(resetUrl, user.name || "");
    const text = buildResetPasswordEmailText(resetUrl, user.name || "");

    const emailResult = await sendEmail({
      to: email,
      subject: "Reset Your Password - Ledgerflow",
      html,
      text,
    });

    if (!emailResult.success) {
      console.error("Failed to send password reset email:", emailResult.error);
      // Still return success to not reveal if email exists
      return NextResponse.json({
        success: true,
        warning: "Email service may be unavailable. Please try again later."
      });
    }

    console.log(`Password reset email sent to: ${email}`);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Forgot password request failed", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}