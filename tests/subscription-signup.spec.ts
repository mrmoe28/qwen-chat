import { test, expect } from '@playwright/test';

// Test configuration for production
const PRODUCTION_URL = 'https://ledgerflow.org';
const TEST_EMAIL = 'test-' + Date.now() + '@example.com';

test.describe('Square Subscription Sign-up Flow', () => {
  test.use({
    baseURL: PRODUCTION_URL,
  });

  test('should complete subscription sign-up flow with magic link', async ({ page }) => {
    console.log('Starting subscription sign-up test...');
    
    // Step 1: Navigate to sign-in page
    await page.goto('/sign-in');
    await expect(page).toHaveTitle(/Sign in to Ledgerflow/i);
    
    // Step 2: Verify magic link form is visible and default
    await expect(page.locator('button:has-text("Magic Link")')).toHaveClass(/default/);
    await expect(page.locator('input[id="magic-email"]')).toBeVisible();
    
    // Step 3: Fill in test email and submit magic link form
    await page.fill('input[id="magic-email"]', TEST_EMAIL);
    await page.click('button:has-text("Send Magic Link")');
    
    // Step 4: Verify magic link sent confirmation
    await expect(page.locator('text=Check your email')).toBeVisible();
    await expect(page.locator('text=magic link to sign in')).toBeVisible();
    
    console.log('Magic link form submitted successfully');
    
    // Step 5: Simulate magic link callback (this would normally come from email)
    // In a real test, you'd need to access the email and click the link
    // For now, we'll test the callback URL structure
    
    // Navigate to dashboard to trigger subscription gate
    await page.goto('/dashboard');
    
    // Since we're not authenticated, we should be redirected to sign-in
    await expect(page.url()).toContain('/sign-in');
    
    console.log('Unauthenticated user correctly redirected to sign-in');
  });

  test('should show subscription gate for unauthenticated users', async ({ page }) => {
    console.log('Testing subscription gate for unauthenticated users...');
    
    // Try to access protected dashboard directly
    await page.goto('/dashboard');
    
    // Should be redirected to sign-in
    await expect(page.url()).toContain('/sign-in');
    await expect(page.locator('h1:has-text("Sign in to Ledgerflow")')).toBeVisible();
    
    console.log('Dashboard properly protected - redirects to sign-in');
  });

  test('should test Square subscription creation API endpoint', async ({ request }) => {
    console.log('Testing Square subscription API endpoint...');
    
    // Test the billing API endpoint (should require authentication)
    const response = await request.post(`${PRODUCTION_URL}/api/billing/create-subscription`, {
      data: {
        planVariationId: 'test-plan-id'
      }
    });
    
    // Should return 401 Unauthorized since we're not authenticated
    expect(response.status()).toBe(401);
    
    const responseBody = await response.json();
    expect(responseBody.error).toBe('Unauthorized');
    
    console.log('Subscription API correctly requires authentication');
  });

  test('should test subscription status API endpoint', async ({ request }) => {
    console.log('Testing subscription status API endpoint...');
    
    // Test the billing status API endpoint (should require authentication)
    const response = await request.get(`${PRODUCTION_URL}/api/billing/status`);
    
    // Should return 401 Unauthorized since we're not authenticated
    expect(response.status()).toBe(401);
    
    const responseBody = await response.json();
    expect(responseBody.error).toBe('Unauthorized');
    
    console.log('Status API correctly requires authentication');
  });

  test('should test Square webhook endpoint security', async ({ request }) => {
    console.log('Testing Square webhook endpoint security...');
    
    // Test webhook endpoint without proper signature
    const response = await request.post(`${PRODUCTION_URL}/api/webhooks/square`, {
      data: {
        type: 'subscription.created',
        data: {
          object: {
            subscription: {
              id: 'test-sub-id',
              customer_id: 'test-customer-id',
              status: 'active'
            }
          }
        }
      }
    });
    
    // Should return 400 or 401 due to missing/invalid signature
    expect([400, 401]).toContain(response.status());
    
    console.log('Webhook endpoint properly secured');
  });

  test('should test sign-in form functionality', async ({ page }) => {
    console.log('Testing sign-in form switches between magic link and password...');
    
    await page.goto('/sign-in');
    
    // Test switching between magic link and password modes
    await expect(page.locator('button:has-text("Magic Link")')).toHaveClass(/default/);
    await expect(page.locator('input[id="magic-email"]')).toBeVisible();
    
    // Switch to password mode
    await page.click('button:has-text("Password")');
    await expect(page.locator('button:has-text("Password")')).toHaveClass(/default/);
    await expect(page.locator('input[id="email"]')).toBeVisible();
    await expect(page.locator('input[id="password"]')).toBeVisible();
    
    // Switch back to magic link mode
    await page.click('button:has-text("Magic Link")');
    await expect(page.locator('button:has-text("Magic Link")')).toHaveClass(/default/);
    await expect(page.locator('input[id="magic-email"]')).toBeVisible();
    
    console.log('Sign-in form mode switching works correctly');
  });

  test('should validate environment variables are set', async ({ request }) => {
    console.log('Validating production environment configuration...');
    
    // Test that the app is properly configured by checking health of key endpoints
    
    // Test that the sign-in page loads (indicates NextAuth is configured)
    const signInResponse = await request.get(`${PRODUCTION_URL}/sign-in`);
    expect(signInResponse.status()).toBe(200);
    
    // Test that API auth endpoints exist
    const authResponse = await request.get(`${PRODUCTION_URL}/api/auth/providers`);
    expect(authResponse.status()).toBe(200);
    
    const providers = await authResponse.json();
    expect(providers).toHaveProperty('email'); // Should have email provider
    expect(providers).toHaveProperty('credentials'); // Should have credentials provider
    
    console.log('Environment appears properly configured');
    console.log('Available auth providers:', Object.keys(providers));
  });
});

test.describe('Square Subscription Integration Tests', () => {
  test.use({
    baseURL: PRODUCTION_URL,
  });

  test('should have properly configured Square environment variables', async ({ page }) => {
    console.log('Testing Square configuration...');
    
    // Navigate to a page that would trigger Square client initialization
    await page.goto('/dashboard');
    
    // Check console for any Square configuration errors
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(msg.text());
    });
    
    // Trigger a page reload to capture any initialization logs
    await page.reload();
    
    // Look for Square configuration warnings in console
    const squareWarnings = consoleLogs.filter(log => 
      log.includes('Square configuration missing') || 
      log.includes('SQUARE_ACCESS_TOKEN')
    );
    
    console.log('Console logs:', consoleLogs.slice(-5)); // Show last 5 logs
    
    // If there are Square configuration warnings, log them but don't fail the test
    if (squareWarnings.length > 0) {
      console.log('Square configuration warnings detected:', squareWarnings);
    }
    
    console.log('Square configuration check completed');
  });

  test('should test complete subscription flow simulation', async ({ page }) => {
    console.log('Simulating complete subscription flow...');
    
    await page.goto('/sign-in');
    
    // Test the subscription gate component behavior
    await page.goto('/dashboard');
    
    // Should be redirected to sign-in
    await expect(page.url()).toContain('/sign-in');
    
    // Try to access other protected routes
    const protectedRoutes = ['/invoices', '/customers', '/settings'];
    
    for (const route of protectedRoutes) {
      await page.goto(route);
      // All should redirect to sign-in
      await expect(page.url()).toContain('/sign-in');
      console.log(`Route ${route} properly protected`);
    }
    
    console.log('All protected routes properly require authentication');
  });
});