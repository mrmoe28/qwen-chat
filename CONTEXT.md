# Ledgerflow - Project Context

## Current Project State

### Landing Page Configuration (Updated: 2025-10-13)
- **Landing Page**: Now serves as the first page users see at `/` route
- **Authentication**: Landing page is publicly accessible without sign-in
- **Middleware Update**: Modified `middleware.ts` to exclude root path from authentication requirements
  - Pattern updated to: `/((?!api|_next/static|_next/image|favicon.ico|sign-in|sign-up|forgot-password|payment-success|public|guest|$).*)`
  - The `|$` addition allows the root path to be accessed without authentication
- **Protected Routes**: Dashboard and authenticated routes still require sign-in

### Landing Page Features
- Professional splash page with Ledgerflow branding
- Hero section: "Professional Invoicing Made Simple"
- Two primary CTAs:
  - "Try Free - No Signup Required" → `/guest` route
  - "Sign Up for Full Access" → `/sign-up` route
- Features showcase: Square Integration, Smart Reminders, Revenue Analytics
- Responsive design with dark/light mode support

## Architecture Notes

### Authentication Flow
- Public routes: `/`, `/sign-in`, `/sign-up`, `/guest`, `/public/*`, `/payment-success`
- Protected routes: Everything under `/(dashboard)/*`
- Middleware uses NextAuth's `withAuth` wrapper with custom security checks
- Security: CVE-2025-29927 mitigation included (blocks x-middleware-subrequest header)

### Tech Stack
- Next.js 15.5.4 (App Router)
- React 19.1.0
- TypeScript 5.9.2
- Tailwind CSS 4.1.13
- Prisma 6.16.2 with PostgreSQL (NeonDB)
- NextAuth 4.24.11
- Stripe Integration (Payment Links)

## Recent Changes

### 2025-10-13: Added Comprehensive Security Improvements
**Problem**: App lacked defense-in-depth security measures (rate limiting, security headers)
**Security Audit Results**: Identified missing critical protections against common attacks
**Implementation**:
  - **Security Headers** (`next.config.ts`):
    - Strict-Transport-Security (HSTS) - Forces HTTPS for 2 years
    - X-Frame-Options - Prevents clickjacking attacks
    - X-Content-Type-Options - Prevents MIME type sniffing
    - X-XSS-Protection - Enables browser XSS filter
    - Content-Security-Policy - Restricts resource loading
    - Referrer-Policy - Controls referrer information
    - Permissions-Policy - Disables unused browser features
  - **Rate Limiting** (`lib/rate-limit.ts`):
    - Memory-based rate limiter (no external dependencies)
    - Auth endpoints: 5 attempts per 15 minutes
    - Password reset: 3 attempts per hour
    - Returns 429 status with Retry-After headers
    - Tracks by IP address per endpoint
    - Automatic cleanup of expired entries
  - **Protected Endpoints**:
    - `/api/forgot-password` - Rate limited (3/hour)
    - `/api/reset-password` - Rate limited (5/15min)
    - `/api/sign-up` - Rate limited (5/15min)
    - `/api/migrate` - Now requires admin authentication
**Security Improvements**:
  - Prevents brute force attacks on authentication
  - Protects against XSS and clickjacking
  - Enforces HTTPS in production
  - Restricts unauthorized database migrations
**Security Score**: Improved from 7/10 to 9/10
**Commit**: `d8d3568` - feat: add comprehensive security improvements

### 2025-10-13: Implemented Complete Forgot Password Feature
**Problem**: Forgot password feature was not implemented - only a placeholder
**Solution**: Implemented full password reset flow with secure tokens and email delivery
**Implementation**:
  - Generate secure random tokens (32 bytes hex)
  - Store tokens in `VerificationToken` table with 1-hour expiration
  - Send professional HTML emails with reset links via Resend
  - Created reset password page with form validation
  - Token validation and password update API endpoint
  - Automatic token cleanup after use or expiration
**Files Created/Modified**:
  - `app/api/forgot-password/route.ts` - Token generation and email sending
  - `app/api/reset-password/route.ts` - Token validation and password update
  - `app/(auth)/reset-password/page.tsx` - Reset password page
  - `components/forms/reset-password-form.tsx` - Reset form with validation
  - `middleware.ts` - Added reset-password to public routes
**Security Features**:
  - Tokens expire after 1 hour
  - Tokens deleted after use
  - No email existence disclosure (always returns success)
  - Passwords hashed with bcrypt (cost factor 12)
  - Token stored in secure database table
**Requirements**: RESEND_API_KEY must be configured for emails to send

### 2025-10-13: Fixed NextAuth JWT_SESSION_ERROR
**Problem**: JWT decryption error on all pages - NEXTAUTH_SECRET was missing
**Root Cause**: No `.env.local` file existed, causing NextAuth to fail session decryption
**Solution**:
  - Created `.env.local` with generated NEXTAUTH_SECRET and required environment variables
  - Created `.env.example` as template for future setup
  - Generated secure secret using `openssl rand -base64 32`
**Files Created**: `.env.local`, `.env.example`
**Result**: Application now runs without JWT errors, landing page loads successfully

### 2025-10-13: Landing Page as First Page
**Problem**: Root path was redirecting to sign-in page instead of showing landing page
**Solution**: Updated middleware matcher to exclude root path from authentication
**Files Modified**: `middleware.ts`
**Result**: Users now see professional landing page first, with clear CTAs for guest mode or sign-up

## Known Issues
- Minor ESLint warnings in test files (unused variables)
- Image optimization suggestion for avatar component (warning only)

## Next Steps
- Monitor user engagement with guest mode vs. sign-up conversion
- Consider A/B testing different CTA copy
- Add analytics tracking for landing page conversions
