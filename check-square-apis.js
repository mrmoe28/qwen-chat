const { SquareClient } = require('square');

const client = new SquareClient({
  token: 'test-token',
  environment: 'Sandbox'
});

console.log('Available Square APIs:');
console.log(Object.keys(client).filter(k => !k.startsWith('_')).sort());

console.log('\nSubscriptions API methods:');
if (client.subscriptionsApi) {
  console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(client.subscriptionsApi)).filter(m => !m.startsWith('_') && m !== 'constructor'));
}

console.log('\nCustomers API methods:');
if (client.customersApi) {
  console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(client.customersApi)).filter(m => !m.startsWith('_') && m !== 'constructor'));
}