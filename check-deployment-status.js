#!/usr/bin/env node

/**
 * Script to monitor Vercel deployment status and run tests when ready
 */

const { execSync } = require('child_process');

async function checkDeploymentStatus() {
  try {
    console.log('🔍 Checking Vercel deployment status...');
    
    const output = execSync('vercel ls --scope ekoapps --json', { 
      encoding: 'utf-8',
      timeout: 10000 
    });
    
    const deployments = JSON.parse(output);
    const latestDeployment = deployments[0];
    
    if (!latestDeployment) {
      console.log('❌ No deployments found');
      return false;
    }
    
    console.log(`📊 Latest deployment: ${latestDeployment.url}`);
    console.log(`🎯 Status: ${latestDeployment.state}`);
    console.log(`⏰ Age: ${new Date(latestDeployment.createdAt).toLocaleString()}`);
    
    if (latestDeployment.state === 'READY') {
      console.log('✅ Deployment is ready!');
      return true;
    } else if (latestDeployment.state === 'ERROR') {
      console.log('❌ Latest deployment has errors');
      return false;
    } else {
      console.log(`⏳ Deployment is ${latestDeployment.state.toLowerCase()}...`);
      return false;
    }
    
  } catch (error) {
    console.log('🚨 Error checking deployment status:', error.message);
    return false;
  }
}

async function waitForDeployment() {
  console.log('🚀 Monitoring deployment status for Square subscription testing...');
  console.log('🔄 Will check every 30 seconds until deployment is ready\n');
  
  let attempts = 0;
  const maxAttempts = 20; // 10 minutes max wait
  
  while (attempts < maxAttempts) {
    const isReady = await checkDeploymentStatus();
    
    if (isReady) {
      console.log('\n🎉 Deployment is ready! You can now run the Playwright tests:');
      console.log('npx playwright test subscription-signup.spec.ts --config=playwright.config.production.ts --headed');
      break;
    }
    
    attempts++;
    if (attempts < maxAttempts) {
      console.log(`\n⏰ Waiting 30 seconds before next check (${attempts}/${maxAttempts})...\n`);
      await new Promise(resolve => setTimeout(resolve, 30000));
    } else {
      console.log('\n⏰ Max wait time reached. Please check deployment manually.');
    }
  }
}

// Run if called directly
if (require.main === module) {
  waitForDeployment().catch(console.error);
}

module.exports = { checkDeploymentStatus, waitForDeployment };