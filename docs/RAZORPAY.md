# 💳 Razorpay Payment Integration

Complete payment gateway integration with Razorpay for your Go application using clean architecture principles.

## 📋 Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [Integration Guide](#integration-guide)
- [Error Handling](#error-handling)
- [Security](#security)
- [Troubleshooting](#troubleshooting)

---

## ✨ Features

- ✅ Create payment orders
- ✅ Verify payment signatures using HMAC-SHA256
- ✅ Track payment status (pending, success, failed, refunded)
- ✅ Payment history with pagination
- ✅ Support for multiple payment methods (UPI, Cards, Net Banking, Wallets)
- ✅ Secure signature verification
- ✅ Cart integration
- ✅ Delivery address management
- ✅ Custom notes/metadata support

---

## 📦 Prerequisites

- Go 1.19 or higher
- PostgreSQL 13 or higher
- Razorpay account ([Sign up here](https://razorpay.com))
- GORM for database operations
- Gin framework for HTTP routing

---

## 🚀 Installation

### 1. Install Razorpay Go SDK

```bash
go get github.com/razorpay/razorpay-go
```

### 2. Install Required Dependencies

```bash
go get github.com/gin-gonic/gin
go get github.com/google/uuid
go get gorm.io/gorm
go get gorm.io/driver/postgres
```

---

## ⚙️ Configuration

### 1. Environment Variables

Add the following to your `.env` file:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_secret_here

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name

# Server Configuration
SERVER_PORT=8080
JWT_SECRET=your_jwt_secret_key
```

### 2. Get Razorpay Credentials

1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Go to **Settings** → **API Keys**
3. Generate Test/Live API Keys
4. Copy `Key ID` and `Key Secret`

### 3. Config Structure (config/config.go)

```go
type Config struct {
    Server   ServerConfig   `mapstructure:"server"`
    Database DatabaseConfig `mapstructure:"database"`
    Payment  PaymentConfig  `mapstructure:"payment"`
    JWT      JWTConfig      `mapstructure:"jwt"`
}

type PaymentConfig struct {
    RazorpayKey    string `mapstructure:"razorpay_key"`
    RazorpaySecret string `mapstructure:"razorpay_secret"`
}
```

---

## 🗄️ Database Setup

### Run Migrations

The `Payment` entity will be auto-migrated by GORM:

```go
db.AutoMigrate(&entity.Payment{})
```

### Payment Table Schema

```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id VARCHAR(40) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    user_id UUID NOT NULL,
    cart_id UUID,
    razorpay_order_id VARCHAR(255) UNIQUE,
    razorpay_payment_id VARCHAR(255),
    razorpay_signature VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending',
    payment_method VARCHAR(50),
    description TEXT,
    notes JSONB,
    failure_reason TEXT,
    delivery_address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (cart_id) REFERENCES carts(id)
);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_razorpay_payment_id ON payments(razorpay_payment_id);
```

---

## 🔌 API Endpoints

All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

### 1. Create Payment Order

**POST** `/api/payment/create-order`

Creates a new payment order in Razorpay and your database.

**Request:**
```json
{
    "amount": 999.50,
    "currency": "INR",
    "description": "Purchase of medicines",
    "cartId": "42fbc1dd-9dee-490c-9f05-841b27ddef7b",
    "deliveryAddress": "123 Main Street, Apartment 4B, Mumbai, Maharashtra 400001",
    "notes": {
        "customerName": "John Doe",
        "email": "john@example.com",
        "phone": "+919876543210"
    }
}
```

**Response:**
```json
{
    "success": true,
    "message": "Order created successfully",
    "data": {
        "orderId": "ORD1760906677f391d409",
        "razorpayOrderId": "order_RVT4mmIx6Ytq9j",
        "amount": 999.5,
        "currency": "INR",
        "razorpayKeyId": "rzp_test_XXXXXXX",
        "notes": {
            "customerName": "John Doe",
            "email": "john@example.com"
        }
    }
}
```

### 2. Verify Payment

**POST** `/api/payment/verify`

Verifies the payment signature after successful payment from frontend.

**Request:**
```json
{
    "orderId": "ORD1760906677f391d409",
    "razorpayOrderId": "order_RVT4mmIx6Ytq9j",
    "razorpayPaymentId": "pay_XXXXXXXXXXXXX",
    "razorpaySignature": "generated_signature_from_razorpay"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Payment verified successfully",
    "data": {
        "orderId": "ORD1760906677f391d409",
        "razorpayOrderId": "order_RVT4mmIx6Ytq9j",
        "razorpayPaymentId": "pay_XXXXXXXXXXXXX",
        "status": "success",
        "amount": 999.5,
        "currency": "INR",
        "paymentMethod": "upi"
    }
}
```

### 3. Get Payment Status

**GET** `/api/payment/status/:orderId`

Retrieves the current status of a payment.

**Response:**
```json
{
    "success": true,
    "message": "Payment status retrieved successfully",
    "data": {
        "orderId": "ORD1760906677f391d409",
        "razorpayOrderId": "order_RVT4mmIx6Ytq9j",
        "razorpayPaymentId": "pay_XXXXXXXXXXXXX",
        "status": "success",
        "amount": 999.5,
        "currency": "INR",
        "paymentMethod": "upi"
    }
}
```

### 4. Get User Payment History

**GET** `/api/payment/history?page=1&limit=10`

Retrieves paginated payment history for the authenticated user.

**Response:**
```json
{
    "success": true,
    "message": "Payments retrieved successfully",
    "data": [
        {
            "id": "uuid",
            "orderId": "ORD1760906677f391d409",
            "amount": 999.5,
            "currency": "INR",
            "status": "success",
            "paymentMethod": "upi",
            "description": "Purchase of medicines",
            "createdAt": "2025-10-20T10:30:00Z"
        }
    ],
    "pagination": {
        "page": 1,
        "limit": 10,
        "total": 25,
        "totalPages": 3
    }
}
```

---

## 🧪 Testing

### Using cURL

#### 1. Create Order
```bash
curl -X POST http://localhost:8080/api/payment/create-order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "amount": 999.50,
    "currency": "INR",
    "description": "Purchase of medicines",
    "deliveryAddress": "123 Main Street, Mumbai"
  }'
```

#### 2. Verify Payment
```bash
curl -X POST http://localhost:8080/api/payment/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "orderId": "ORD1760906677f391d409",
    "razorpayOrderId": "order_RVT4mmIx6Ytq9j",
    "razorpayPaymentId": "pay_XXXXX",
    "razorpaySignature": "signature"
  }'
```

#### 3. Check Status
```bash
curl -X GET "http://localhost:8080/api/payment/status/ORD1760906677f391d409" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 4. Get History
```bash
curl -X GET "http://localhost:8080/api/payment/history?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test Cards (Razorpay Test Mode)

| Card Number | CVV | Expiry | Result |
|-------------|-----|--------|--------|
| 4111 1111 1111 1111 | 123 | Any future date | Success |
| 4012 0010 0000 0001 | 123 | Any future date | Success |
| 5555 5555 5555 4444 | 123 | Any future date | Success |

### Test UPI IDs

- `success@razorpay`
- `failure@razorpay`

---

## 🔗 Integration Guide

### Frontend Integration (React/Vue/Angular)

```javascript
// 1. Load Razorpay Script
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>

// 2. Create Order
const createOrder = async (orderData) => {
  const response = await fetch('http://localhost:8080/api/payment/create-order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(orderData)
  });
  return response.json();
};

// 3. Initialize Razorpay
const handlePayment = async () => {
  const order = await createOrder({
    amount: 999.50,
    currency: 'INR',
    description: 'Purchase of medicines'
  });

  const options = {
    key: order.data.razorpayKeyId,
    amount: order.data.amount * 100,
    currency: order.data.currency,
    order_id: order.data.razorpayOrderId,
    name: 'Your Company Name',
    description: 'Purchase Description',
    handler: async (response) => {
      // 4. Verify Payment
      await fetch('http://localhost:8080/api/payment/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId: order.data.orderId,
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature
        })
      });
    },
    prefill: {
      name: 'Customer Name',
      email: 'customer@example.com',
      contact: '+919876543210'
    },
    theme: {
      color: '#3399cc'
    }
  };

  const razorpay = new Razorpay(options);
  razorpay.open();
};
```

### Mobile Integration (React Native)

```bash
npm install react-native-razorpay
```

```javascript
import RazorpayCheckout from 'react-native-razorpay';

const handlePayment = async () => {
  const order = await createOrder({ amount: 999.50 });

  const options = {
    key: order.data.razorpayKeyId,
    amount: order.data.amount * 100,
    currency: order.data.currency,
    order_id: order.data.razorpayOrderId,
    name: 'Your App Name',
    prefill: {
      email: 'customer@example.com',
      contact: '+919876543210'
    }
  };

  RazorpayCheckout.open(options)
    .then((data) => {
      // Verify payment
      verifyPayment(data);
    })
    .catch((error) => {
      console.error(error);
    });
};
```

---

## ⚠️ Error Handling

### Common Error Codes

| Error | Reason | Solution |
|-------|--------|----------|
| `receipt: the length must be no more than 40` | Order ID too long | Use shortened order ID format |
| `Unauthorized` | Missing/invalid JWT token | Check Authorization header |
| `invalid payment signature` | Signature verification failed | Check Razorpay secret key |
| `payment not found` | Invalid order ID | Verify order ID is correct |
| `failed to create razorpay order` | Razorpay API error | Check API credentials |

### Error Response Format

```json
{
    "error": "Failed to create order",
    "message": "failed to create razorpay order: receipt: the length must be no more than 40."
}
```

---

## 🔒 Security

### Best Practices

1. **Never expose Razorpay Secret Key** on the frontend
2. **Always verify payment signature** on the backend
3. **Use HTTPS** in production
4. **Validate all input data** before processing
5. **Store sensitive data encrypted** in the database
6. **Implement rate limiting** on payment endpoints
7. **Log all payment transactions** for auditing
8. **Use test mode** during development

### Signature Verification

The payment signature is verified using HMAC-SHA256:

```go
message := razorpayOrderID + "|" + razorpayPaymentID
mac := hmac.New(sha256.New, []byte(razorpaySecret))
mac.Write([]byte(message))
expectedSignature := hex.EncodeToString(mac.Sum(nil))
isValid := hmac.Equal([]byte(expectedSignature), []byte(razorpaySignature))
```

---

## 🐛 Troubleshooting

### Issue: Nil Pointer Dereference

**Symptom:** `runtime error: invalid memory address or nil pointer dereference`

**Solution:**
- Ensure `PaymentRepository` is initialized in container
- Don't dereference pointer when assigning to container
- Check all dependencies are properly injected

```go
// ❌ Wrong
c.PaymentUseCase = *usecase.NewPaymentUseCase(...)

// ✅ Correct
c.PaymentUseCase = usecase.NewPaymentUseCase(...)
```

### Issue: Order ID Too Long

**Symptom:** `receipt: the length must be no more than 40`

**Solution:** Use shortened order ID format (max 40 chars)

```go
timestamp := time.Now().Unix()
shortUUID := uuid.New().String()[:8]
orderID := fmt.Sprintf("ORD%d%s", timestamp, shortUUID)
```

### Issue: Payment Verification Fails

**Symptom:** `invalid payment signature`

**Solution:**
- Check Razorpay secret key is correct
- Ensure signature format: `razorpayOrderId|razorpayPaymentId`
- Verify HMAC-SHA256 algorithm is used

### Issue: Cannot Connect to Database

**Symptom:** `failed to save payment`

**Solution:**
- Check database connection string
- Verify database is running
- Run migrations to create tables
- Check user has proper permissions

---

## 📚 Additional Resources

- [Razorpay API Documentation](https://razorpay.com/docs/api/)
- [Razorpay Payment Gateway](https://razorpay.com/docs/payment-gateway/)
- [Razorpay Test Cards](https://razorpay.com/docs/payments/payments/test-card-details/)
- [Razorpay Webhooks](https://razorpay.com/docs/webhooks/)
- [Go Razorpay SDK](https://github.com/razorpay/razorpay-go)

---

## 📝 Payment Flow Diagram

```
Frontend                  Backend                    Razorpay
   |                         |                          |
   |--1. Create Order------->|                          |
   |                         |---2. Create Order------->|
   |                         |<--3. Order Details-------|
   |<--4. Order Response-----|                          |
   |                         |                          |
   |--5. Open Razorpay------>|                          |
   |                         |                          |
   |--6. Complete Payment---------------------------->|
   |<--7. Payment Response (ID, Signature)------------|
   |                         |                          |
   |--8. Verify Payment----->|                          |
   |                         |---9. Fetch Details------>|
   |                         |<--10. Payment Info-------|
   |                         |--11. Verify Signature    |
   |                         |--12. Update DB           |
   |<--13. Success Response--|                          |
```

---

## 🎯 Payment Status Flow

```
pending → success    (Payment completed successfully)
pending → failed     (Payment failed or cancelled)
success → refunded   (Refund processed)
```

---

## 📄 License

This implementation is provided as-is for integration with Razorpay payment gateway.

---

## 🤝 Support

For issues related to:
- **Backend Integration:** Check troubleshooting section above
- **Razorpay API:** Contact [Razorpay Support](https://razorpay.com/support/)
- **Payment Issues:** Check Razorpay Dashboard for transaction logs

---

## 📌 Quick Start Checklist

- [ ] Install Razorpay Go SDK
- [ ] Get Razorpay API credentials
- [ ] Add credentials to `.env` file
- [ ] Initialize PaymentRepository in container
- [ ] Run database migrations
- [ ] Test create order endpoint
- [ ] Integrate frontend with Razorpay checkout
- [ ] Test payment verification
- [ ] Check payment history
- [ ] Switch to live mode for production

---

**Happy Coding! 💻**