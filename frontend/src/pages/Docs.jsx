import React from 'react';

const Docs = () => {
  return (
    <div className="p-8 max-w-5xl mx-auto" data-test-id="api-docs">
      <h2 className="text-3xl font-bold mb-8">Integration Guide</h2>

      <section className="mb-12" data-test-id="section-create-order">
        <h3 className="text-xl font-bold mb-4">1. Create Order</h3>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre data-test-id="code-snippet-create-order">
{`curl -X POST http://localhost:8000/api/v1/orders \\
  -H "X-Api-Key: key_test_abc123" \\
  -H "X-Api-Secret: secret_test_xyz789" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 50000,
    "currency": "INR",
    "receipt": "receipt_123"
  }'`}
          </pre>
        </div>
      </section>

      <section className="mb-12" data-test-id="section-sdk-integration">
        <h3 className="text-xl font-bold mb-4">2. SDK Integration</h3>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre data-test-id="code-snippet-sdk">
{`<script src="http://localhost:3001/checkout.js"></script>
<script>
  const checkout = new PaymentGateway({
    key: 'key_test_abc123',
    orderId: 'order_xyz',
    onSuccess: (response) => {
      console.log('Payment ID:', response.paymentId);
    }
  });
  checkout.open();
</script>`}
          </pre>
        </div>
      </section>

      <section className="mb-12" data-test-id="section-webhook-verification">
        <h3 className="text-xl font-bold mb-4">3. Verify Webhook Signature</h3>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre data-test-id="code-snippet-webhook">
{`const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  return signature === expectedSignature;
}`}
          </pre>
        </div>
      </section>
    </div>
  );
};

export default Docs;