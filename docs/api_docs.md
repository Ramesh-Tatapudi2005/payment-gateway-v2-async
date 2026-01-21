## 📖 API Documentation
**Base URL**: `http://localhost:8000`

1. **Authentication**  
Protected endpoints require the following headers:
- `X-Api-Key`: Your merchant API key.
- `X-Api-Secret`: Your merchant API secret.

2. **Health check**  
`GET /health` Verify system and service status.  
**Response (200 OK):**  
```json
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "worker": "running",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

3. **Orders (Private)**  
`POST /api/v1/orders` Used by the merchant's server to create a payment intent.  
**Request Body:**  
```json
{
  "amount": 50000,
  "currency": "INR",
  "receipt": "receipt_123",
  "notes": { "customer_name": "John Doe" }
}
```  
**Response (201 Created):**  
```json
{
  "amount": 50000,
  "currency": "INR",
  "receipt": "receipt_123",
  "notes": { "customer_name": "John Doe" }
}
```  
4. **Orders (Public)**  
`GET /api/v1/orders/{order_id}/public` Used by the Hosted Checkout Page. No authentication required.  
**Response (200 OK):**  
```json 
{
  "id": "order_NXhj67fGH2jk9mPq",
  "amount": 50000,
  "currency": "INR",
  "status": "created"
}
```
5. **Payments (Public)**  
`POST /api/v1/payments/public` Used by the Hosted Checkout Page to initiate payment.  
**Request Body (Card):**  
```json
{
  "order_id": "order_NXhj67fGH2jk9mPq",
  "method": "card",
  "card": {
    "number": "4111111111111111",
    "expiry_month": "12",
    "expiry_year": "2028",
    "cvv": "123",
    "holder_name": "John Doe"
  }
}
```  
**State Machine Logic:**
-  Payment is created with status: `processing`.
-  Delay of 5-10s (Simulated Bank Latency).
-  Status transitions to `success` or `failed`.  

6. **Standardized Error Codes**  
The API returns the following codes for validation and processing failures:  
`AUTHENTICATION_ERROR` : `401`, Invalid API Key or Secret.  
`BAD_REQUEST_ERROR`    : `400` , Missing fields or malformed JSON.  
`INVALID_VPA`  : `400` , UPI VPA format is incorrect.  
`INVALID_CARD`  : `400` , Card failed Luhn algorithm check.  
`EXPIRED_CARD`  : `400` , Card expiry date is in the past.  
`NOT_FOUND_ERROR` : `404` , Resource (Order/Payment) not found.  
`PAYMENT_FAILED` : `200`/`400` , Bank declined the transaction.  

7. **Test Endpoints**  
`GET /api/v1/test/merchant` Helper endpoint to verify merchant seeding.  
**Response:**  
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "test@example.com",
  "api_key": "key_test_abc123",
  "seeded": true
}
```  



