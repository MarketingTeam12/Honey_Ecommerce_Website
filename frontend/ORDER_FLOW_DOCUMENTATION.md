# Complete E-Commerce Order Flow Documentation

## Overview
This document describes the complete end-to-end order flow for Honey Translation Services, from product selection to order completion, including customer and admin perspectives.

---

## Customer Journey: Complete Order Flow

### 1. Product Selection
**Location:** Any product page (e.g., `/products/saudi-apostille`)

**Process:**
1. Customer browses available services (Translation, Apostille, Attestation, Startup Packages)
2. Selects a specific service (e.g., "Saudi Apostille")
3. Configures service options:
   - Upload documents (if required)
   - Select number of pages
   - Choose additional options (language, certificate type, etc.)
4. Reviews calculated price based on selections
5. Clicks "Add to Cart"

**Technical Details:**
- Product data managed via `ProductContext`
- Cart managed via `CartContext` (stored in React state)
- File uploads handled via Supabase Storage

---

### 2. Shopping Cart
**Location:** `/cart` (NewCartPage component)

**Features:**
- View all added items
- Update page count for each item
- Remove items from cart
- See real-time price calculations
- View cart summary (subtotal, tax, total)

**Actions:**
- Continue shopping
- Proceed to checkout

---

### 3. Checkout Process

#### Step 1: Address Selection
**Location:** `/checkout/address` (NewCheckoutAddressPage)

**Process:**
1. Customer views saved addresses or adds new address
2. Selects billing/shipping address
3. Can apply coupon codes:
   - `HONEY10` - 10% discount
   - `FIRST20` - 20% discount
4. Reviews order summary with discount applied
5. Clicks "Continue to Review"

**Data Storage:**
- Selected address saved to `localStorage` as `shipping_address`
- Used later in payment processing

#### Step 2: Order Review
**Location:** `/checkout/review` (NewCheckoutReviewPage)

**Process:**
1. Customer reviews:
   - All order items
   - Billing address
   - Order summary (subtotal, discount, tax, total)
2. Confirms all details are correct
3. Clicks "Continue to Payment"

#### Step 3: Payment
**Location:** `/checkout/payment` (NewPaymentPage)

**Process:**
1. Customer selects payment method:
   - Credit/Debit Card
   - UPI
   - Net Banking
   - Wallet
2. Reviews final order summary
3. Clicks "Pay Now"

**Backend Integration:**
```javascript
POST /make-server-a67f0635/payment/create-order
Body: {
  userId: string,
  amount: number,
  currency: 'INR',
  paymentMethod: string,
  items: CartItem[],
  subtotal: number,
  discount: number,
  tax: number,
  shippingAddress: Address
}

Response: {
  orderId: string,
  paymentId: string,
  paymentUrl: string | null,
  callbackUrl: string
}
```

**Payment Flow:**
- Creates order in database with status: `pending`
- Creates payment record with status: `initiated`
- **Production:** Redirects to Zoho Payment Gateway
- **Demo Mode:** Simulates payment success after 2.5 seconds

---

### 4. Order Confirmation
**Location:** `/order-success?orderId=<ORDER_ID>`

**Features:**
- Success confirmation message
- Order details:
  - Order ID
  - Order date
  - Total amount
  - Payment status
  - Order items with individual prices
- "What happens next" guide
- Action buttons:
  - View My Orders
  - Contact on WhatsApp
- Support contact information

---

### 5. Order Tracking
**Location:** `/my-orders` (MyOrdersPage)

**Features:**
- List of all customer orders
- Amazon-style order tracking timeline showing:
  1. ✅ Order Placed
  2. ⏳ Confirmed
  3. ⏳ Processing
  4. ⏳ Shipped (with tracking number if available)
  5. ⏳ Delivered

**Order Status Indicators:**
- **Pending/Confirmed:** Yellow badge - "Order Placed"
- **Processing:** Blue badge - "Processing"
- **Shipped:** Purple badge - "Shipped" (shows tracking number)
- **Delivered:** Green badge - "Delivered"
- **Cancelled:** Red badge - "Cancelled"

**Actions Available:**
- View order details (modal)
- Download completed files (when available)
- Track shipment status

---

## Admin Dashboard: Order Management

### 1. Sales Overview
**Location:** `/admin/sales` (SalesPage)

**Dashboard Statistics:**
- Total Orders
- Pending Orders
- Shipped Orders
- Delivered Orders
- Total Revenue (from paid/delivered orders)

**Order Filters:**
- All Orders
- Pending
- Processing
- Shipped
- Delivered
- Cancelled

**Order Table Columns:**
- Order ID
- Customer (name & email)
- Date
- Items count
- Total amount
- Status badge
- Payment status badge
- Actions (View Details, Update Status)

---

### 2. Order Status Management

**Available Status Updates:**
1. **Pending** → Initial state after order creation
2. **Confirmed** → Payment verified, order confirmed
3. **Processing** → Work started on the order
4. **Shipped** → Order dispatched to customer
5. **Delivered** → Order completed and delivered
6. **Cancelled** → Order cancelled

**Update Process:**
1. Admin clicks "Edit" button on an order
2. Modal opens with:
   - Status dropdown
   - Tracking number field (for shipped/delivered)
   - Shipping carrier field (for shipped/delivered)
3. Admin updates status and adds tracking info
4. Clicks "Update Status"
5. Backend updates order and timestamps

**Backend Endpoint:**
```javascript
PATCH /make-server-a67f0635/orders/:id/status
Body: {
  status: string,
  tracking_number?: string,
  shipping_carrier?: string,
  estimated_delivery?: string
}
```

**Auto-Timestamps:**
- `shipped_at` - Set when status changes to "shipped"
- `delivered_at` - Set when status changes to "delivered"
- `updated_at` - Updated on every status change

---

### 3. Order Details View (Admin)

**Information Displayed:**
- **Customer Information:**
  - Name
  - Email

- **Order Information:**
  - Order date
  - Payment method
  - Order status (with color-coded badge)
  - Payment status (with color-coded badge)
  - Tracking number (if available)
  - Shipping carrier (if available)

- **Order Items:**
  - Item name
  - Page count
  - Unit price
  - Total price

- **Order Summary:**
  - Subtotal
  - Discount
  - Tax
  - **Total Amount**

---

## Backend Architecture

### Order Data Model
```typescript
{
  id: string,                      // order_ORD-123456789
  order_number: string,            // ORD-123456789-ABCD
  user_id: string,                 // Customer user ID
  customer_name: string,           // Customer name
  customer_email: string,          // Customer email
  payment_id: string,              // PAY-123456789-ABCD
  payment_method: string,          // card, upi, netbanking, wallet
  payment_status: string,          // pending, paid, failed
  status: string,                  // pending, confirmed, processing, shipped, delivered, cancelled
  total_amount: string,            // Total order amount
  subtotal: string,                // Before discount and tax
  discount: string,                // Discount applied
  tax: string,                     // Tax amount (18% GST)
  currency: string,                // INR
  items: OrderItem[],              // Array of order items
  shipping_address: Address,       // Shipping address object
  tracking_number: string | null,  // Shipping tracking number
  shipping_carrier: string | null, // Carrier name (FedEx, DHL, etc.)
  estimated_delivery: string | null,
  created_at: string,              // ISO timestamp
  updated_at: string,              // ISO timestamp
  shipped_at: string | null,       // ISO timestamp
  delivered_at: string | null      // ISO timestamp
}
```

### Payment Gateway Integration

**Current Implementation:**
- Backend ready for Zoho Payment Gateway integration
- Demo mode: Simulates successful payment after 2.5 seconds
- Order and payment records created before payment processing

**Production Setup (Zoho):**
1. Sign up for Zoho Payment Gateway account
2. Get API credentials (Merchant ID, API Key, etc.)
3. Update backend `/payment/create-order` endpoint to:
   ```javascript
   // Call Zoho API to create payment session
   const zohoResponse = await fetch('https://api.zoho.com/payment/create', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${ZOHO_API_KEY}`,
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({
       amount: total,
       currency: 'INR',
       order_id: orderId,
       return_url: `${callbackUrl}`,
       // ... other Zoho parameters
     })
   });
   
   const { payment_url } = await zohoResponse.json();
   return payment_url;
   ```
4. Update callback handler to process Zoho webhook responses
5. Verify payment signatures for security

---

## API Endpoints Summary

### Customer Endpoints

**Get User's Orders:**
```
GET /make-server-a67f0635/orders/my-orders
Headers: Authorization: Bearer <token>
Response: { orders: Order[] }
```

**Get Single Order:**
```
GET /make-server-a67f0635/orders/:id
Headers: Authorization: Bearer <token>
Response: { order: Order }
```

**Download Completed File:**
```
GET /make-server-a67f0635/orders/:id/download-completed-file
Headers: Authorization: Bearer <token>
Response: { downloadUrl: string }
```

### Payment Endpoints

**Create Payment Order:**
```
POST /make-server-a67f0635/payment/create-order
Headers: Authorization: Bearer <token>
Body: { userId, amount, currency, paymentMethod, items, subtotal, discount, tax, shippingAddress }
Response: { orderId, paymentId, paymentUrl, callbackUrl }
```

**Payment Callback:**
```
GET /make-server-a67f0635/payment/callback?orderId=<id>&paymentId=<id>&status=<status>
Response: Redirects to /order-success or /payment-failed
```

**Verify Payment:**
```
POST /make-server-a67f0635/payment/verify
Body: { orderId, paymentId }
Response: { verified: boolean, payment: Payment, order: Order }
```

### Admin Endpoints

**Get All Orders (Admin):**
```
GET /make-server-a67f0635/orders
Headers: Authorization: Bearer <admin_token>
Response: { orders: Order[] }
```

**Update Order Status (Admin):**
```
PATCH /make-server-a67f0635/orders/:id/status
Headers: Authorization: Bearer <admin_token>
Body: { status, tracking_number?, shipping_carrier?, estimated_delivery? }
Response: { message, order: Order }
```

---

## Authentication

### Demo Credentials

**Customer Account:**
- Email: `customer@example.com`
- Password: `customer123`
- User ID: `2`
- Token: `mock-token-2`

**Admin Account:**
- Email: `admin@honeytranslations.com`
- Password: `admin123`
- User ID: `1`
- Token: `mock-token-1`

**Token Storage:**
- Stored in localStorage as `supabase_token`
- Sent in Authorization header: `Bearer <token>`

---

## Order Status Flow

```
┌─────────────┐
│   PENDING   │ ← Order created, payment initiated
└──────┬──────┘
       │ Payment successful
       ↓
┌─────────────┐
│  CONFIRMED  │ ← Payment verified
└──────┬──────┘
       │ Admin starts work
       ↓
┌─────────────┐
│ PROCESSING  │ ← Work in progress
└──────┬──────┘
       │ Admin ships order
       ↓
┌─────────────┐
│   SHIPPED   │ ← In transit (tracking number added)
└──────┬──────┘
       │ Delivered to customer
       ↓
┌─────────────┐
│  DELIVERED  │ ← Order complete
└─────────────┘

     OR

┌─────────────┐
│  CANCELLED  │ ← Order cancelled at any stage
└─────────────┘
```

---

## Key Features

### Customer Experience
✅ Easy product selection and configuration
✅ Real-time price calculation
✅ Smooth checkout flow (Address → Review → Payment)
✅ Multiple payment methods
✅ Order confirmation with details
✅ Amazon-style order tracking timeline
✅ Email and WhatsApp notifications (planned)
✅ Download completed files

### Admin Experience
✅ Comprehensive sales dashboard with analytics
✅ Real-time order statistics
✅ Filter orders by status
✅ View complete order details
✅ Update order status with tracking information
✅ Customer information access
✅ Order timeline visibility

### Technical Features
✅ Supabase backend integration
✅ Secure authentication with JWT tokens
✅ RESTful API endpoints
✅ Order data persistence in KV store
✅ Payment gateway integration (ready for Zoho)
✅ File upload and storage (Supabase Storage)
✅ Responsive design for all devices
✅ Real-time updates

---

## Next Steps for Production

1. **Payment Gateway:**
   - Complete Zoho Payment Gateway integration
   - Add payment webhook handling
   - Implement payment verification and security

2. **Email Notifications:**
   - Set up email service (e.g., SendGrid, AWS SES)
   - Order confirmation emails
   - Order status update emails
   - Invoice generation and delivery

3. **WhatsApp Notifications:**
   - Integrate WhatsApp Business API
   - Send order updates at each status change
   - Allow customer queries via WhatsApp

4. **Order Management:**
   - Add order search and filtering by date range
   - Export orders to CSV/Excel
   - Bulk status updates
   - Order notes and internal comments

5. **Customer Features:**
   - Order cancellation requests
   - Return/refund management
   - Order rating and feedback
   - Repeat orders with one click

6. **Reports and Analytics:**
   - Revenue reports by date range
   - Popular products analysis
   - Customer purchase patterns
   - Conversion funnel analysis

---

## Testing the Flow

### Customer Flow Test:
1. Sign in as customer (`customer@example.com` / `customer123`)
2. Browse to a product page (e.g., Saudi Apostille)
3. Upload a document and select page count
4. Add to cart
5. Go to cart page
6. Proceed to checkout
7. Select/add address
8. Review order
9. Select payment method and pay
10. View order success page
11. Navigate to "My Orders"
12. Track order status

### Admin Flow Test:
1. Sign in as admin (`admin@honeytranslations.com` / `admin123`)
2. Navigate to Admin Panel
3. Go to Sales section
4. View all orders
5. Filter by status
6. Click "View Details" on an order
7. Click "Update Status" button
8. Change status to "Processing"
9. Change status to "Shipped" and add tracking number
10. Verify customer sees updated status in their "My Orders"

---

## Support

For any questions or issues:
- **Email:** salesteam@honeytranslations.com
- **Phone:** +91 72990 05577
- **WhatsApp:** +91 72990 05577

---

**Last Updated:** January 3, 2026
**Version:** 2.0
