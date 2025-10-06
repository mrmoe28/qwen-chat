# Square Subscription Testing Instructions

## Prerequisites
1. Ensure production deployment is working (Status: ● Ready)
2. Verify all environment variables are set in Vercel
3. Check that https://ledgerflow.org is accessible

## Quick Deployment Status Check
```bash
vercel ls --scope ekoapps | head -5
```
Look for "● Ready" status on the latest deployment.

## Running Production Tests

### Full Test Suite
```bash
npx playwright test subscription-signup.spec.ts --config=playwright.config.production.ts --headed
```

### Individual Test Categories

1. **Authentication & Subscription Gate**
```bash
npx playwright test subscription-signup.spec.ts --config=playwright.config.production.ts --grep "subscription gate" --headed
```

2. **API Endpoint Security**
```bash
npx playwright test subscription-signup.spec.ts --config=playwright.config.production.ts --grep "API endpoint"
```

3. **Sign-in Form Functionality**
```bash
npx playwright test subscription-signup.spec.ts --config=playwright.config.production.ts --grep "sign-in form"
```

4. **Square Integration**
```bash
npx playwright test subscription-signup.spec.ts --config=playwright.config.production.ts --grep "Square"
```

## Test Coverage

### ✅ What the tests verify:
- Magic link authentication flow
- Subscription gate protecting dashboard access
- API endpoints require authentication
- Square webhook endpoint security
- Sign-in form mode switching (magic link vs password)
- Environment configuration validation
- Protected routes redirect properly

### 🔧 Manual verification needed:
- Actual Square subscription creation (requires valid plan variation ID)
- Email delivery for magic links
- Square webhook event processing
- Real payment flow completion

## Expected Results

### When deployment is working:
- All API endpoints should return proper 401 Unauthorized for unauthenticated requests
- Dashboard should redirect to /sign-in when accessed without authentication
- Sign-in form should toggle between magic link and password modes
- Environment should have required auth providers configured

### When deployment has issues:
- Tests may timeout or fail to connect
- API endpoints might return 500 errors
- Pages might not load properly

## Troubleshooting

If tests fail:
1. Check deployment status: `vercel ls --scope ekoapps`
2. Verify production URL is accessible: curl https://ledgerflow.org
3. Check environment variables are set in Vercel dashboard
4. Review deployment logs for build errors

## Post-Deployment Testing Checklist

- [ ] Run authentication tests
- [ ] Verify subscription gate works
- [ ] Test API endpoint security
- [ ] Validate environment configuration
- [ ] Check sign-in form functionality
- [ ] Test Square integration endpoints