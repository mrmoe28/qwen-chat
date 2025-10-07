#!/bin/bash

echo "🚀 Quick Production Test for Square Subscription Integration"
echo "=========================================================="

echo "1. Checking deployment status..."
vercel ls --scope ekoapps | head -3

echo -e "\n2. Testing basic connectivity..."
curl -s -o /dev/null -w "Status: %{http_code}\n" https://ledgerflow.org/sign-in

echo -e "\n3. Testing API endpoint (should return 401)..."
curl -s -w "Status: %{http_code}\n" https://ledgerflow.org/api/billing/status

echo -e "\n4. Ready to run full Playwright test suite?"
echo "Run: npx playwright test subscription-signup.spec.ts --config=playwright.config.production.ts --headed"