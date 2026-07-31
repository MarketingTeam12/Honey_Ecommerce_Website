# Honey Translation Services - API Integration Reference

## 🔌 Complete API Documentation for Backend Integration

This document provides exact request/response formats for all API endpoints. Use this when integrating with Node.js + MySQL or any other backend.

---

## 🌐 Base Configuration

### API Base URL
```
https://{projectId}.supabase.co/functions/v1/make-server-a67f0635
```

### Authentication Header
```javascript
// All authenticated requests
Headers: {
  "Content-Type": "application/json",
  "Authorization": "Bearer {accessToken}"
}

// Public requests (no auth)
Headers: {
  "Content-Type": "application/json"
}
```

### Using the buildHeaders Utility
```javascript
import { buildHeaders } from '@/app/utils/buildHeaders';

// Automatically includes JWT token
const headers = buildHeaders(accessToken);

// Returns:
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGc..."
}
```

---

## 🔐 Authentication Endpoints

### 1. User Login
**Endpoint**: `POST /auth/login`  
**Auth Required**: No

**Request**:
```json
{
  "email": "customer@example.com",
  "password": "customer123"
}
```

**Response (Success - 200)**:
```json
{
  "success": true,
  "user": {
    "id": "user_abc123",
    "email": "customer@example.com",
    "name": "Demo Customer",
    "phone": "+918888888888",
    "role": "customer"
  },
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "v1.MR5fwQ...",
    "expires_in": 3600,
    "token_type": "bearer"
  }
}
```

**Response (Error - 401)**:
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

---

### 2. User Signup
**Endpoint**: `POST /auth/signup`  
**Auth Required**: No

**Request**:
```json
{
  "email": "newuser@example.com",
  "password": "securePassword123",
  "name": "John Doe",
  "phone": "+919876543210"
}
```

**Response (Success - 201)**:
```json
{
  "success": true,
  "message": "Account created successfully",
  "user": {
    "id": "user_xyz789",
    "email": "newuser@example.com",
    "name": "John Doe",
    "phone": "+919876543210",
    "role": "customer"
  }
}
```

**Response (Error - 400)**:
```json
{
  "success": false,
  "error": "Email already exists"
}
```

---

### 3. Test Authentication
**Endpoint**: `POST /auth/test`  
**Auth Required**: Yes

**Request**:
```json
{}
```

**Headers**:
```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (Success - 200)**:
```json
{
  "success": true,
  "message": "Authentication successful",
  "user": {
    "id": "demo-admin-1",
    "email": "admin@honeytranslations.com",
    "name": "Admin User"
  }
}
```

**Response (Error - 401)**:
```json
{
  "success": false,
  "error": "No Authorization header"
}
```

---

## 📦 Order Endpoints

### 4. Create Order
**Endpoint**: `POST /orders`  
**Auth Required**: Yes (Customer or Admin)

**Request**:
```json
{
  "items": [
    {
      "id": "product_translation_001",
      "name": "English to Spanish Translation",
      "price": 1500,
      "quantity": 1,
      "pageCount": 5,
      "sourceLanguage": "English",
      "targetLanguage": "Spanish",
      "documentType": "Legal Document",
      "fileName": "contract_agreement.pdf"
    }
  ],
  "shipping_address": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+919876543210",
    "address_line1": "123 Main Street",
    "address_line2": "Apt 4B",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "country": "India"
  },
  "payment_method": "zoho_payments",
  "subtotal": 1500.00,
  "tax": 270.00,
  "total_amount": 1770.00,
  "currency": "INR"
}
```

**Response (Success - 201)**:
```json
{
  "success": true,
  "message": "Order created successfully",
  "order": {
    "id": "order_1738779449582",
    "order_number": "ORD-1738779449582-ABC123",
    "tracking_number": "TRK-1738779449582-XYZ789",
    "user_id": "user_abc123",
    "customer_name": "John Doe",
    "customer_email": "john@example.com",
    "status": "pending",
    "payment_status": "pending",
    "payment_method": "zoho_payments",
    "subtotal": "1500.00",
    "tax": "270.00",
    "total_amount": "1770.00",
    "currency": "INR",
    "estimated_delivery": "2026-03-10T00:00:00Z",
    "items": [
      {
        "id": "product_translation_001",
        "name": "English to Spanish Translation",
        "price": "1500.00",
        "quantity": 1,
        "pageCount": 5,
        "sourceLanguage": "English",
        "targetLanguage": "Spanish",
        "documentType": "Legal Document"
      }
    ],
    "shipping_address": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+919876543210",
      "address_line1": "123 Main Street",
      "address_line2": "Apt 4B",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001",
      "country": "India"
    },
    "created_at": "2026-03-03T10:30:00Z",
    "updated_at": "2026-03-03T10:30:00Z"
  }
}
```

---

### 5. Get All Orders (Admin)
**Endpoint**: `GET /orders`  
**Auth Required**: Yes (Admin only)

**Query Parameters**:
```
?page=1
&limit=10
&status=all
&search=john
&sort=created_at
&order=desc
```

**Response (Success - 200)**:
```json
{
  "success": true,
  "orders": [
    {
      "id": "order_1738779449582",
      "order_number": "ORD-1738779449582-ABC123",
      "tracking_number": "TRK-1738779449582-XYZ789",
      "user_id": "user_abc123",
      "customer_name": "John Doe",
      "customer_email": "john@example.com",
      "status": "translator-working",
      "payment_status": "paid",
      "payment_method": "zoho_payments",
      "total_amount": "1770.00",
      "currency": "INR",
      "items": [
        {
          "id": "product_translation_001",
          "name": "English to Spanish Translation",
          "pageCount": 5,
          "sourceLanguage": "English",
          "targetLanguage": "Spanish"
        }
      ],
      "created_at": "2026-03-03T10:30:00Z",
      "updated_at": "2026-03-04T14:20:00Z"
    },
    // ... more orders
  ],
  "pagination": {
    "total": 156,
    "page": 1,
    "limit": 10,
    "totalPages": 16
  }
}
```

---

### 6. Get Single Order
**Endpoint**: `GET /orders/:id`  
**Auth Required**: Yes (Owner or Admin)

**Response (Success - 200)**:
```json
{
  "success": true,
  "order": {
    "id": "order_1738779449582",
    "order_number": "ORD-1738779449582-ABC123",
    "tracking_number": "TRK-1738779449582-XYZ789",
    "user_id": "user_abc123",
    "customer_name": "John Doe",
    "customer_email": "john@example.com",
    "customer_phone": "+919876543210",
    "status": "translator-working",
    "payment_status": "paid",
    "payment_method": "zoho_payments",
    "subtotal": "1500.00",
    "tax": "270.00",
    "total_amount": "1770.00",
    "currency": "INR",
    "estimated_delivery": "2026-03-10T00:00:00Z",
    "items": [
      {
        "id": "product_translation_001",
        "name": "English to Spanish Translation",
        "price": "1500.00",
        "quantity": 1,
        "pageCount": 5,
        "sourceLanguage": "English",
        "targetLanguage": "Spanish",
        "documentType": "Legal Document",
        "fileName": "contract_agreement.pdf"
      }
    ],
    "shipping_address": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+919876543210",
      "address_line1": "123 Main Street",
      "address_line2": "Apt 4B",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001",
      "country": "India"
    },
    "timeline": [
      {
        "status": "received",
        "timestamp": "2026-03-03T10:30:00Z",
        "note": "Order received and payment confirmed"
      },
      {
        "status": "document-analysis",
        "timestamp": "2026-03-03T14:15:00Z",
        "note": "Document analyzed - 5 pages, Legal category"
      },
      {
        "status": "translator-assigned",
        "timestamp": "2026-03-04T09:00:00Z",
        "note": "Assigned to Maria Garcia (Legal Specialist)"
      },
      {
        "status": "translator-working",
        "timestamp": "2026-03-04T11:00:00Z",
        "note": "Translation in progress - 65% complete"
      }
    ],
    "admin_notes": "High priority client. Expected completion by March 8.",
    "created_at": "2026-03-03T10:30:00Z",
    "updated_at": "2026-03-04T14:20:00Z"
  }
}
```

**Response (Error - 404)**:
```json
{
  "success": false,
  "error": "Order not found"
}
```

---

### 7. Update Order Status (Admin)
**Endpoint**: `PUT /orders/:id/status`  
**Auth Required**: Yes (Admin only)

**Request**:
```json
{
  "status": "proof-checking",
  "progress": 75,
  "admin_notes": "Translation completed. Now in quality check phase. Expected completion by March 8."
}
```

**Available Status Values**:
```json
[
  "pending",
  "received",
  "payment-received",
  "confirmed",
  "document-analysis",
  "translator-assigned",
  "translator-working",
  "formatting",
  "proof-checking",
  "draft",
  "soft",
  "courier",
  "shipped",
  "delivered",
  "cancelled"
]
```

**Response (Success - 200)**:
```json
{
  "success": true,
  "message": "Order status updated successfully",
  "order": {
    "id": "order_1738779449582",
    "order_number": "ORD-1738779449582-ABC123",
    "status": "proof-checking",
    "progress": 75,
    "admin_notes": "Translation completed. Now in quality check phase.",
    "updated_at": "2026-03-05T16:45:00Z"
  }
}
```

---

### 8. Track Order (Public - No Auth)
**Endpoint**: `POST /orders/track`  
**Auth Required**: No

**Request (Method 1 - Order Number + Email)**:
```json
{
  "orderNumber": "ORD-1738779449582-ABC123",
  "email": "john@example.com"
}
```

**Request (Method 2 - Order Number + Phone)**:
```json
{
  "orderNumber": "ORD-1738779449582-ABC123",
  "phone": "+919876543210"
}
```

**Request (Method 3 - Tracking Number Only)**:
```json
{
  "trackingNumber": "TRK-1738779449582-XYZ789"
}
```

**Response (Success - 200)**:
```json
{
  "success": true,
  "order": {
    "id": "order_1738779449582",
    "order_number": "ORD-1738779449582-ABC123",
    "tracking_number": "TRK-1738779449582-XYZ789",
    "status": "translator-working",
    "payment_status": "paid",
    "estimated_delivery": "2026-03-10T00:00:00Z",
    "items": [
      {
        "id": "product_translation_001",
        "name": "English to Spanish Translation",
        "pageCount": 5
      }
    ],
    "shipping_address": {
      "city": "Mumbai",
      "state": "Maharashtra",
      "country": "India"
    },
    "customer_name": "John Doe",
    "customer_email": "john@example.com",
    "total_amount": "1770.00",
    "currency": "INR",
    "created_at": "2026-03-03T10:30:00Z",
    "updated_at": "2026-03-04T14:20:00Z"
  }
}
```

**Response (Error - 404)**:
```json
{
  "success": false,
  "error": "Order not found. Please check your order number and email/phone."
}
```

---

### 9. Get User's Orders
**Endpoint**: `GET /orders/user/:userId`  
**Auth Required**: Yes (Owner or Admin)

**Response (Success - 200)**:
```json
{
  "success": true,
  "orders": [
    {
      "id": "order_1738779449582",
      "order_number": "ORD-1738779449582-ABC123",
      "status": "translator-working",
      "payment_status": "paid",
      "total_amount": "1770.00",
      "items": [
        {
          "name": "English to Spanish Translation",
          "pageCount": 5
        }
      ],
      "created_at": "2026-03-03T10:30:00Z"
    },
    // ... more orders
  ],
  "count": 8
}
```

---

## 👥 Customer Endpoints

### 10. Get All Customers (Admin)
**Endpoint**: `GET /customers`  
**Auth Required**: Yes (Admin only)

**Query Parameters**:
```
?page=1
&limit=10
&status=active
&search=john
&sort=signup_date
&order=desc
```

**Response (Success - 200)**:
```json
{
  "success": true,
  "customers": [
    {
      "id": "user_abc123",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+919876543210",
      "signup_date": "2026-01-15T09:30:00Z",
      "status": "active",
      "totalOrders": 8,
      "totalSpent": 15240.00,
      "source": "Website Registration",
      "last_order_date": "2026-03-03T10:30:00Z"
    },
    {
      "id": "user_def456",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "phone": "+919876543211",
      "signup_date": "2026-02-10T14:20:00Z",
      "status": "active",
      "totalOrders": 5,
      "totalSpent": 9850.00,
      "source": "Google Ads",
      "last_order_date": "2026-02-28T11:15:00Z"
    }
    // ... more customers
  ],
  "count": 89,
  "pagination": {
    "total": 89,
    "page": 1,
    "limit": 10,
    "totalPages": 9
  }
}
```

---

### 11. Get Single Customer (Admin)
**Endpoint**: `GET /customers/:id`  
**Auth Required**: Yes (Admin only)

**Response (Success - 200)**:
```json
{
  "success": true,
  "customer": {
    "id": "user_abc123",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+919876543210",
    "signup_date": "2026-01-15T09:30:00Z",
    "status": "active",
    "totalOrders": 8,
    "totalSpent": 15240.00,
    "source": "Website Registration",
    "addresses": [
      {
        "id": "addr_001",
        "type": "shipping",
        "address_line1": "123 Main Street",
        "address_line2": "Apt 4B",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400001",
        "country": "India",
        "is_default": true
      }
    ],
    "orders": [
      {
        "id": "order_1738779449582",
        "order_number": "ORD-1738779449582-ABC123",
        "status": "translator-working",
        "total_amount": "1770.00",
        "created_at": "2026-03-03T10:30:00Z"
      }
      // ... more orders
    ],
    "created_at": "2026-01-15T09:30:00Z",
    "updated_at": "2026-03-04T14:20:00Z"
  }
}
```

---

## 📊 Admin Dashboard Endpoints

### 12. Get Dashboard Statistics
**Endpoint**: `GET /admin/dashboard-stats`  
**Auth Required**: Yes (Admin only)

**Response (Success - 200)**:
```json
{
  "success": true,
  "stats": {
    "totalProducts": 45,
    "totalOrders": 156,
    "totalCustomers": 89,
    "totalRevenue": "425680.00"
  },
  "pendingOrdersCount": 8,
  "cancellationRequestsCount": 2,
  "pendingPaymentsCount": 5,
  "outOfStockCount": 2,
  "recentOrders": [
    {
      "id": "order_1738779449582",
      "order_number": "ORD-1738779449582-ABC123",
      "customer_name": "John Doe",
      "status": "translator-working",
      "total_amount": "1770.00",
      "created_at": "2026-03-03T10:30:00Z"
    }
    // ... more recent orders (last 5)
  ],
  "revenueByMonth": [
    {
      "month": "January",
      "revenue": 125680.00
    },
    {
      "month": "February",
      "revenue": 150000.00
    },
    {
      "month": "March",
      "revenue": 150000.00
    }
  ],
  "topServices": [
    {
      "name": "English to Spanish Translation",
      "orders": 45,
      "revenue": 67500.00
    },
    {
      "name": "Apostille Services - USA",
      "orders": 32,
      "revenue": 96000.00
    }
  ]
}
```

---

## 💳 Payment Endpoints (Zoho Payments)

### 13. Initiate Payment
**Endpoint**: `POST /payments/initiate`  
**Auth Required**: Yes

**Request**:
```json
{
  "order_id": "order_1738779449582",
  "amount": 1770.00,
  "currency": "INR",
  "customer_email": "john@example.com",
  "customer_name": "John Doe",
  "customer_phone": "+919876543210",
  "return_url": "https://honeytranslations.com/order-success",
  "cancel_url": "https://honeytranslations.com/payment-failed"
}
```

**Response (Success - 200)**:
```json
{
  "success": true,
  "payment_id": "pay_abc123xyz",
  "payment_url": "https://payments.zoho.com/checkout/pay_abc123xyz",
  "order_id": "order_1738779449582",
  "amount": 1770.00,
  "currency": "INR",
  "status": "created"
}
```

---

### 14. Verify Payment
**Endpoint**: `POST /payments/verify`  
**Auth Required**: Yes

**Request**:
```json
{
  "payment_id": "pay_abc123xyz",
  "order_id": "order_1738779449582",
  "zoho_payment_id": "ZOHO_PAY_789456123"
}
```

**Response (Success - 200)**:
```json
{
  "success": true,
  "payment": {
    "id": "pay_abc123xyz",
    "order_id": "order_1738779449582",
    "zoho_payment_id": "ZOHO_PAY_789456123",
    "status": "success",
    "amount": 1770.00,
    "currency": "INR",
    "payment_method": "UPI",
    "paid_at": "2026-03-03T10:35:00Z"
  },
  "order": {
    "id": "order_1738779449582",
    "payment_status": "paid",
    "status": "received"
  }
}
```

**Response (Failed - 400)**:
```json
{
  "success": false,
  "error": "Payment verification failed",
  "payment": {
    "id": "pay_abc123xyz",
    "status": "failed",
    "failure_reason": "Insufficient funds"
  }
}
```

---

### 15. Payment Webhook (Zoho Callback)
**Endpoint**: `POST /payments/webhook`  
**Auth Required**: No (verified by signature)

**Request from Zoho**:
```json
{
  "event": "payment.success",
  "payment_id": "ZOHO_PAY_789456123",
  "order_id": "order_1738779449582",
  "amount": 1770.00,
  "currency": "INR",
  "payment_method": "UPI",
  "status": "success",
  "timestamp": "2026-03-03T10:35:00Z",
  "signature": "abcd1234efgh5678ijkl9012"
}
```

**Response (Success - 200)**:
```json
{
  "success": true,
  "message": "Webhook processed successfully"
}
```

---

## 👨‍💼 Translator Endpoints (Ready for Implementation)

### 16. Get All Translators (Admin)
**Endpoint**: `GET /translators`  
**Auth Required**: Yes (Admin only)

**Proposed Response Structure**:
```json
{
  "success": true,
  "translators": [
    {
      "id": "trans_001",
      "name": "Maria Garcia",
      "email": "maria.garcia@honeytranslations.com",
      "phone": "+34612345678",
      "languages": [
        {
          "source": "English",
          "target": "Spanish",
          "proficiency": "native"
        },
        {
          "source": "Spanish",
          "target": "English",
          "proficiency": "native"
        }
      ],
      "specialization": "Legal Documents",
      "totalProjects": 247,
      "completedProjects": 245,
      "activeProjects": 2,
      "successRate": 99.19,
      "averageRating": 4.9,
      "status": "available",
      "joinDate": "2023-01-15T00:00:00Z",
      "certifications": [
        "ATA Certified",
        "Legal Translation Specialist"
      ]
    },
    {
      "id": "trans_002",
      "name": "Priya Sharma",
      "email": "priya.sharma@honeytranslations.com",
      "phone": "+919876543210",
      "languages": [
        {
          "source": "English",
          "target": "Hindi",
          "proficiency": "native"
        },
        {
          "source": "English",
          "target": "Tamil",
          "proficiency": "fluent"
        }
      ],
      "specialization": "Educational Certificates",
      "totalProjects": 312,
      "completedProjects": 310,
      "activeProjects": 2,
      "successRate": 99.36,
      "averageRating": 5.0,
      "status": "available",
      "joinDate": "2022-11-05T00:00:00Z",
      "certifications": [
        "ISO Certified Translator",
        "Educational Document Specialist"
      ]
    }
  ],
  "count": 15,
  "available": 8,
  "busy": 5,
  "offline": 2
}
```

---

### 17. Assign Translator to Order
**Endpoint**: `POST /orders/:orderId/assign-translator`  
**Auth Required**: Yes (Admin only)

**Proposed Request**:
```json
{
  "translator_id": "trans_001",
  "estimated_completion": "2026-03-08T18:00:00Z",
  "notes": "High priority client. Legal translation expertise required."
}
```

**Proposed Response**:
```json
{
  "success": true,
  "message": "Translator assigned successfully",
  "order": {
    "id": "order_1738779449582",
    "status": "translator-assigned",
    "assigned_translator": {
      "id": "trans_001",
      "name": "Maria Garcia",
      "specialization": "Legal Documents"
    },
    "estimated_completion": "2026-03-08T18:00:00Z"
  }
}
```

---

## 📧 Notification Endpoints

### 18. Get Admin Notifications
**Endpoint**: `GET /admin/notifications`  
**Auth Required**: Yes (Admin only)

**Response (Success - 200)**:
```json
{
  "success": true,
  "notifications": [
    {
      "id": "notif_001",
      "type": "new_order",
      "title": "New Order Received",
      "message": "John Doe placed a new order for English to Spanish Translation",
      "order_id": "order_1738779449582",
      "read": false,
      "created_at": "2026-03-03T10:30:00Z"
    },
    {
      "id": "notif_002",
      "type": "payment_received",
      "title": "Payment Confirmed",
      "message": "Payment of ₹1,770 received for order ORD-1738779449582-ABC123",
      "order_id": "order_1738779449582",
      "read": false,
      "created_at": "2026-03-03T10:35:00Z"
    },
    {
      "id": "notif_003",
      "type": "low_stock",
      "title": "Low Stock Alert",
      "message": "Product 'Translation Template Forms' is running low on stock",
      "product_id": "prod_456",
      "read": true,
      "created_at": "2026-03-02T15:20:00Z"
    }
  ],
  "unread_count": 2,
  "total": 45
}
```

---

## 🔧 Utility Endpoints

### 19. Health Check
**Endpoint**: `GET /health`  
**Auth Required**: No

**Response**:
```json
{
  "status": "ok",
  "message": "Server is running",
  "timestamp": "2026-03-03T10:30:00Z",
  "version": "1.0.0"
}
```

---

### 20. Get Demo Token
**Endpoint**: `GET /demo-token`  
**Auth Required**: No

**Response**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "type": "jwt",
  "user": {
    "id": "demo-admin-1",
    "email": "admin@honeytranslations.com",
    "name": "Admin User",
    "role": "admin"
  }
}
```

---

## 🚨 Error Response Format

All errors follow this consistent format:

**General Error (400)**:
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "email": "Email is required",
    "password": "Password must be at least 8 characters"
  }
}
```

**Unauthorized (401)**:
```json
{
  "success": false,
  "error": "Authentication required"
}
```

**Forbidden (403)**:
```json
{
  "success": false,
  "error": "You don't have permission to access this resource"
}
```

**Not Found (404)**:
```json
{
  "success": false,
  "error": "Resource not found"
}
```

**Server Error (500)**:
```json
{
  "success": false,
  "error": "Internal server error",
  "message": "An unexpected error occurred. Please try again later."
}
```

---

## 📝 Data Models

### Order Model
```typescript
interface Order {
  id: string;
  order_number: string;          // ORD-{timestamp}-{random}
  tracking_number: string;       // TRK-{timestamp}-{random}
  user_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: string;
  
  items: OrderItem[];
  shipping_address: Address;
  
  subtotal: string;              // Decimal as string
  tax: string;
  total_amount: string;
  currency: string;              // INR, USD, etc.
  
  estimated_delivery: string;    // ISO date
  shipped_at?: string;
  delivered_at?: string;
  
  admin_notes?: string;
  timeline: OrderTimeline[];
  
  created_at: string;
  updated_at: string;
}

type OrderStatus = 
  | "pending"
  | "received"
  | "payment-received"
  | "confirmed"
  | "document-analysis"
  | "translator-assigned"
  | "translator-working"
  | "formatting"
  | "proof-checking"
  | "draft"
  | "soft"
  | "courier"
  | "shipped"
  | "delivered"
  | "cancelled";

type PaymentStatus = 
  | "pending"
  | "partial"
  | "paid"
  | "failed"
  | "refunded";
```

### Customer Model
```typescript
interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  signup_date: string;
  status: "active" | "inactive";
  totalOrders: number;
  totalSpent: number;
  source: string;               // "Website", "Google Ads", etc.
  last_order_date?: string;
  addresses: Address[];
  created_at: string;
  updated_at: string;
}
```

### Translator Model
```typescript
interface Translator {
  id: string;
  name: string;
  email: string;
  phone: string;
  languages: LanguagePair[];
  specialization: string;       // "Legal", "Medical", "Technical", etc.
  totalProjects: number;
  completedProjects: number;
  activeProjects: number;
  successRate: number;          // Percentage
  averageRating: number;        // 1-5
  status: "available" | "busy" | "offline";
  joinDate: string;
  certifications: string[];
  created_at: string;
  updated_at: string;
}

interface LanguagePair {
  source: string;
  target: string;
  proficiency: "native" | "fluent" | "intermediate";
}
```

---

## 🔐 Authentication Flow

```
1. User Login
   ↓
2. POST /auth/login
   ↓
3. Server verifies credentials
   ↓
4. Server generates JWT token
   ↓
5. Server returns token + user data
   ↓
6. Client stores token (localStorage/cookie)
   ↓
7. Client includes token in subsequent requests
   Header: "Authorization: Bearer {token}"
   ↓
8. Server verifies token on protected routes
   ↓
9. Server grants/denies access based on role
```

---

## 📊 Sample Test Data

### Test Orders
```json
[
  {
    "order_number": "ORD-1738779449582-ABC123",
    "tracking_number": "TRK-1738779449582-XYZ789",
    "customer_email": "john@example.com",
    "status": "translator-working",
    "progress": 65
  },
  {
    "order_number": "ORD-1738779449583-DEF456",
    "tracking_number": "TRK-1738779449583-PQR123",
    "customer_email": "jane@example.com",
    "status": "draft",
    "progress": 85
  }
]
```

### Test Credentials
```json
{
  "admin": {
    "email": "admin@honeytranslations.com",
    "password": "admin123"
  },
  "customer": {
    "email": "customer@example.com",
    "password": "customer123"
  }
}
```

---

## 🎯 Integration Checklist

### Backend Setup
- [ ] Set up database (MySQL/PostgreSQL)
- [ ] Create tables for orders, customers, users, payments
- [ ] Implement authentication (JWT)
- [ ] Set up Zoho Payments integration
- [ ] Configure CORS
- [ ] Set up error handling
- [ ] Add request logging

### API Implementation
- [ ] Implement all order endpoints
- [ ] Implement customer endpoints
- [ ] Implement authentication endpoints
- [ ] Implement payment endpoints
- [ ] Implement admin dashboard endpoints
- [ ] Add input validation
- [ ] Add rate limiting
- [ ] Add caching (Redis)

### Testing
- [ ] Test all endpoints with Postman
- [ ] Test authentication flow
- [ ] Test order creation and tracking
- [ ] Test payment flow
- [ ] Test error handling
- [ ] Load testing

### Deployment
- [ ] Set environment variables
- [ ] Deploy backend to production
- [ ] Configure SSL certificate
- [ ] Set up monitoring
- [ ] Configure backup system

---

**Last Updated**: March 3, 2026  
**API Version**: 1.0.0  
**Status**: Production Ready ✅
