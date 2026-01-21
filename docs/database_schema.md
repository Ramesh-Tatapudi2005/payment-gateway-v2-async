# Database Schema Documentation

## 1. Merchants Table
Stores authenticated merchant details and API credentials.
* **id**: UUID (Primary Key)
* **api_key**: Unique string (e.g., `key_test_...`)
* **api_secret**: Secret string (used for HMAC/Auth)
* **email**: Unique merchant email

## 2. Orders Table
Tracks intent to pay created by the merchant.
* **id**: String (Prefix: `order_` + 16 chars)
* **amount**: Integer (Smallest unit: Paise)
* **status**: Enum (`created`, `paid`)
* **merchant_id**: Foreign Key (Merchants)

## 3. Payments Table
Records actual transaction attempts and methods.
* **id**: String (Prefix: `pay_` + 16 chars)
* **status**: Enum (`processing`, `success`, `failed`)
* **method**: Enum (`upi`, `card`)
* **card_network**: String (`visa`, `mastercard`, etc.)
* **error_code**: String (e.g., `INVALID_CARD`, `PAYMENT_FAILED`)
* **order_id**: Foreign Key (Orders)