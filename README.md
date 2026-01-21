# Payment Gateway V2: Asynchronous Processing & Webhooks

This project is a production-ready payment gateway featuring asynchronous job processing, a robust webhook delivery system with exponential backoff retries, an embeddable JavaScript SDK, and complete refund management.

## 🚀 Setup Instructions

### Prerequisites
* **Docker** and **Docker Compose** installed.
* **Port Availability**: Ensure ports **8000** (API), **3000** (Dashboard), **3001** (Checkout), and **6379** (Redis) are free.

### Installation
1.  **Extract** the project folder.
2.  **Navigate** to the root directory containing `docker-compose.yml`.
3.  **Launch** the system using the following command:
    ```bash
    docker-compose up -d --build
    ```
4.  **Verify Services**: Access the dashboard at `http://localhost:3000` and the checkout at `http://localhost:3001`.

---

## ⚙️ Environment Variable Configuration

The system behavior is controlled via environment variables in `docker-compose.yml`:

| Variable | Description | Value for Evaluation |
| :--- | :--- | :--- |
| `TEST_MODE` | Enables deterministic job processing. | `true` |
| `TEST_PROCESSING_DELAY` | Sets fixed delay for payment jobs (ms). | `1000` |
| `TEST_PAYMENT_SUCCESS` | Forces payment outcome in test mode. | `true` |
| `WEBHOOK_RETRY_INTERVALS_TEST` | Uses short retry cycles for testing. | `true` |

---

## 🔌 API Endpoint Documentation

### Payment Operations
* **POST `/api/v1/payments`**: Creates a payment and enqueues a background job.
* **POST `/api/v1/payments/{id}/capture`**: Captures a successful payment.
* **POST `/api/v1/payments/{id}/refunds`**: Initiates a full or partial refund.

### Management & Evaluation
* **GET `/api/v1/test/jobs/status`**: Mandatory endpoint for monitoring job queues.
* **GET `/api/v1/payments/refunds`**: Lists all refund records.
* **GET `/api/v1/payments/webhooks`**: Retrieves delivery logs for webhooks.

---

## Testing API Endpoints  (Swagger UI)

Go to the `http://localhost:8000/docs` use the bodies in the API Docs in the dashboard

## 🛠️ Webhook Integration Guide

### Event Delivery
The gateway delivers notifications for events including `payment.success`, `payment.failed`, and `refund.processed`.

### Retry Logic & Backoff
If a merchant's server returns a non-2xx status, the system retries up to **5 times**.
* **Standard Intervals**: 1m, 5m, 30m, 2h.
* **Test Intervals**: 0s, 5s, 10s, 15s, 20s (enabled via `WEBHOOK_RETRY_INTERVALS_TEST`).

### Signature Verification (HMAC-SHA256)
Merchants should verify the `X-Webhook-Signature` header to ensure authenticity:
```javascript
const crypto = require('crypto');
const expectedSignature = crypto
  .createHmac('sha256', merchant_webhook_secret)
  .update(JSON.stringify(payload))
  .digest('hex');
```

## 📦 SDK Integration Guide
Merchants can accept payments via a modal overlay using our embeddable SDK.

### Implementation
Include the script served from your checkout service:

```html
<script src="http://localhost:3001/checkout.js"></script>
<script>
  const checkout = new PaymentGateway({
    key: 'key_test_abc123',
    orderId: 'order_xyz',
    onSuccess: (res) => console.log('Payment Success:', res.paymentId),
    onFailure: (err) => console.log('Payment Failed:', err)
  });
  checkout.open();
</script>
```


## 🧪 Testing Instructions

### 1. Asynchronous Payment Flow
* **Create an Order**: Use the API or the Merchant Dashboard to generate a new order.
* **Checkout**: Complete the payment process at `http://localhost:3001`.
* **Verify Background Processing**: Watch the dashboard to see the payment status transition to "Processing" while the Celery worker handles the transaction.

### 2. Manual Webhook Retry
* **Navigate to Webhooks**: Open the **Webhooks** management page on your dashboard.
* **Identify Failures**: Find a delivery attempt marked as "failed" in the **Delivery History** table.
* **Trigger Retry**: Click the **Manual Retry** button to instantly re-enqueue the webhook delivery job.

### 3. Refund Processing
* **Access Refunds**: Go to the **Refunds** management page.
* **Initiate Refund**: Choose a successful payment from the list and click **Refund Full**.
* **Monitor Status**: The **Refund Status** table will auto-refresh, showing the transition from `PENDING` to `PROCESSED` after the 3–5 second delay.