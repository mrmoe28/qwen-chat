#!/usr/bin/env node

const crypto = require('crypto');
const https = require('https');

// Test configuration
const WEBHOOK_URL = 'http://localhost:3001/api/square/webhook';
const WEBHOOK_SECRET = process.env.SQUARE_WEBHOOK_SECRET || 'test_webhook_secret_key';
const APPLICATION_ID = process.env.SQUARE_APPLICATION_ID || 'test_app_id';

// Sample Square webhook payloads
const sampleEvents = {
  payment_created: {
    merchant_id: 'merchant_123',
    type: 'payment.created',
    event_id: 'event_123',
    created_at: new Date().toISOString(),
    data: {
      type: 'payment',
      id: 'payment_123',
      object: {
        id: 'payment_123',
        amount_money: {
          amount: 5000, // $50.00 in cents
          currency: 'USD'
        },
        reference_id: 'invoice_test_123', // This should match an invoice ID
        status: 'COMPLETED',
        order_id: 'order_123',
        location_id: 'location_123',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
  },
  
  payment_updated: {
    merchant_id: 'merchant_123',
    type: 'payment.updated',
    event_id: 'event_124',
    created_at: new Date().toISOString(),
    data: {
      type: 'payment',
      id: 'payment_123',
      object: {
        id: 'payment_123',
        amount_money: {
          amount: 5000,
          currency: 'USD'
        },
        reference_id: 'invoice_test_123',
        status: 'COMPLETED',
        order_id: 'order_123',
        location_id: 'location_123',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
  },
  
  payment_failed: {
    merchant_id: 'merchant_123',
    type: 'payment.failed',
    event_id: 'event_125',
    created_at: new Date().toISOString(),
    data: {
      type: 'payment',
      id: 'payment_failed_123',
      object: {
        id: 'payment_failed_123',
        amount_money: {
          amount: 2500,
          currency: 'USD'
        },
        reference_id: 'invoice_test_456',
        status: 'FAILED',
        order_id: 'order_456',
        location_id: 'location_123',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
  },
  
  order_created: {
    merchant_id: 'merchant_123',
    type: 'order.created',
    event_id: 'event_126',
    created_at: new Date().toISOString(),
    data: {
      type: 'order',
      id: 'order_123',
      object: {
        id: 'order_123',
        reference_id: 'invoice_test_123',
        state: 'OPEN',
        location_id: 'location_123',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
  },
  
  order_updated: {
    merchant_id: 'merchant_123',
    type: 'order.updated',
    event_id: 'event_127',
    created_at: new Date().toISOString(),
    data: {
      type: 'order',
      id: 'order_123',
      object: {
        id: 'order_123',
        reference_id: 'invoice_test_123',
        state: 'COMPLETED',
        location_id: 'location_123',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
  }
};

function createSignature(payload) {
  return crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('base64');
}

function sendWebhook(eventType) {
  return new Promise((resolve, reject) => {
    const event = sampleEvents[eventType];
    if (!event) {
      reject(new Error(`Unknown event type: ${eventType}`));
      return;
    }

    const payload = JSON.stringify(event);
    const signature = createSignature(payload);
    
    const url = new URL(WEBHOOK_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'X-Square-HmacSha256-Signature': signature,
        'User-Agent': 'Square-Webhooks/1.0'
      }
    };

    const req = (url.protocol === 'https:' ? https : require('http')).request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(payload);
    req.end();
  });
}

async function testWebhook(eventType) {
  console.log(`\n🧪 Testing ${eventType} webhook...`);
  try {
    const response = await sendWebhook(eventType);
    console.log(`✅ Status: ${response.statusCode}`);
    console.log(`📄 Response: ${response.body}`);
    
    if (response.statusCode === 200) {
      console.log(`✨ ${eventType} webhook test passed!`);
    } else {
      console.log(`❌ ${eventType} webhook test failed with status ${response.statusCode}`);
    }
  } catch (error) {
    console.error(`❌ Error testing ${eventType}:`, error.message);
  }
}

async function runAllTests() {
  console.log('🚀 Starting Square webhook tests...');
  console.log(`📡 Webhook URL: ${WEBHOOK_URL}`);
  console.log(`🔑 Using webhook secret: ${WEBHOOK_SECRET.slice(0, 8)}...`);
  
  const eventTypes = Object.keys(sampleEvents);
  
  for (const eventType of eventTypes) {
    await testWebhook(eventType);
    // Add small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n🏁 All tests completed!');
}

// Allow running specific tests or all tests
const eventType = process.argv[2];
if (eventType && sampleEvents[eventType]) {
  testWebhook(eventType);
} else if (eventType) {
  console.error(`❌ Unknown event type: ${eventType}`);
  console.log(`Available types: ${Object.keys(sampleEvents).join(', ')}`);
  process.exit(1);
} else {
  runAllTests();
}

// Export for use as a module
module.exports = {
  sendWebhook,
  testWebhook,
  sampleEvents,
  createSignature
};