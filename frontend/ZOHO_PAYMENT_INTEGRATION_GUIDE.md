# Zoho Payment Gateway Integration Guide

## Overview
This guide provides step-by-step instructions for integrating Zoho Payments into the Honey Translation Services platform.

---

## Current Status

### ✅ What's Already Implemented:
- Complete order creation flow
- Payment order endpoint structure
- Order data model with all required fields
- Payment callback handling
- Order status management
- Frontend payment flow
- Demo mode simulation

### ⏳ What Needs to Be Completed:
- Actual Zoho API integration
- Payment verification with Zoho
- Webhook handling for payment notifications
- Environment variables for Zoho credentials

---

## Zoho Payment Gateway Setup

### Step 1: Create Zoho Payments Account

1. Visit [Zoho Payments](https://www.zoho.com/in/payment-gateway/)
2. Sign up for a business account
3. Complete KYC verification:
   - Business registration documents
   - GST number
   - Bank account details
   - Business owner ID proof
4. Wait for account approval (typically 2-3 business days)

### Step 2: Get API Credentials

Once approved:
1. Log in to Zoho Payments Dashboard
2. Navigate to **Settings → API Keys**
3. Generate new API credentials:
   - **Merchant ID** (Organization ID)
   - **API Key** (Secret Key)
   - **API Secret**
4. Save these credentials securely

### Step 3: Configure Webhooks

1. In Zoho Payments Dashboard, go to **Settings → Webhooks**
2. Add webhook URL:
   ```
   https://<your-project-id>.supabase.co/functions/v1/make-server-a67f0635/payment/webhook
   ```
3. Select events to receive:
   - Payment Authorized
   - Payment Captured
   - Payment Failed
   - Refund Processed
4. Save webhook configuration

---

## Backend Integration

### Step 1: Add Environment Variables

Add to your Supabase Edge Function environment:

```bash
# In Supabase Dashboard → Edge Functions → Secrets
ZOHO_MERCHANT_ID=<your_merchant_id>
ZOHO_API_KEY=<your_api_key>
ZOHO_API_SECRET=<your_api_secret>
ZOHO_BASE_URL=https://api.zoho.com/v2/payment
```

Or using Supabase CLI:
```bash
supabase secrets set ZOHO_MERCHANT_ID=<value>
supabase secrets set ZOHO_API_KEY=<value>
supabase secrets set ZOHO_API_SECRET=<value>
supabase secrets set ZOHO_BASE_URL=https://api.zoho.com/v2/payment
```

### Step 2: Update Payment Creation Endpoint

Replace the demo implementation in `/supabase/functions/server/index.tsx`:

```typescript
// Create payment order
app.post("/make-server-a67f0635/payment/create-order", async (c) => {
  try {
    const body = await c.req.json();
    const { userId, amount, currency, paymentMethod, items, subtotal, discount, tax, shippingAddress } = body;
    
    console.log('💳 Creating payment order with Zoho...');
    
    // Generate unique order ID
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const paymentId = `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    
    // Get customer info
    let customerName = 'Guest';
    let customerEmail = 'guest@example.com';
    
    try {
      const userProfile = await kv.get(`user:${userId}`);
      if (userProfile) {
        customerName = userProfile.name || customerName;
        customerEmail = userProfile.email || customerEmail;
      }
    } catch (profileError) {
      console.warn('⚠️ Could not fetch user profile:', profileError);
    }
    
    // Save order in database BEFORE calling Zoho
    const orderData = {
      id: orderId,
      order_number: orderId,
      user_id: userId,
      customer_name: customerName,
      customer_email: customerEmail,
      payment_id: paymentId,
      payment_method: paymentMethod,
      payment_status: 'pending',
      status: 'pending',
      total_amount: amount.toString(),
      subtotal: subtotal.toString(),
      discount: discount.toString(),
      tax: tax.toString(),
      currency: currency,
      items: items,
      shipping_address: shippingAddress || null,
      tracking_number: null,
      shipping_carrier: null,
      estimated_delivery: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    await kv.set(`order_${orderId}`, JSON.stringify(orderData));
    
    // ==================== ZOHO API INTEGRATION ====================
    
    // 1. Create Zoho Payment Order
    const zohoOrderPayload = {
      merchant_id: Deno.env.get('ZOHO_MERCHANT_ID'),
      order_id: orderId,
      amount: Math.round(amount * 100), // Convert to paise/cents
      currency: currency,
      return_url: `${c.req.url.split('/payment/')[0]}/payment/callback`,
      customer: {
        name: customerName,
        email: customerEmail,
        phone: shippingAddress?.phone || ''
      },
      notes: {
        payment_id: paymentId,
        items_count: items.length
      }
    };
    
    // Generate Zoho API signature (HMAC)
    const signatureString = `${zohoOrderPayload.merchant_id}${zohoOrderPayload.order_id}${zohoOrderPayload.amount}${zohoOrderPayload.currency}`;
    const signature = await crypto.subtle.sign(
      "HMAC",
      await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(Deno.env.get('ZOHO_API_SECRET')),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      ),
      new TextEncoder().encode(signatureString)
    );
    
    const signatureHex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Call Zoho Payment API
    const zohoResponse = await fetch(`${Deno.env.get('ZOHO_BASE_URL')}/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('ZOHO_API_KEY')}`,
        'Content-Type': 'application/json',
        'X-Signature': signatureHex
      },
      body: JSON.stringify(zohoOrderPayload)
    });
    
    if (!zohoResponse.ok) {
      const errorData = await zohoResponse.json();
      console.error('❌ Zoho API error:', errorData);
      throw new Error(`Zoho Payment failed: ${errorData.message || 'Unknown error'}`);
    }
    
    const zohoData = await zohoResponse.json();
    console.log('✅ Zoho payment order created:', zohoData.id);
    
    // Save payment record
    await kv.set(`payment_${paymentId}`, JSON.stringify({
      id: paymentId,
      order_id: orderId,
      zoho_payment_id: zohoData.id,
      amount: amount,
      currency: currency,
      status: 'initiated',
      gateway: 'zoho',
      payment_method: paymentMethod,
      created_at: new Date().toISOString()
    }));
    
    // Return payment URL for redirect
    return c.json({
      success: true,
      orderId,
      paymentId,
      amount,
      currency,
      paymentUrl: zohoData.payment_url, // Zoho hosted payment page
      message: 'Payment order created successfully'
    });
    
  } catch (error) {
    console.error('❌ Create payment order error:', error);
    return c.json({ 
      error: 'Failed to create payment order', 
      details: error.message 
    }, 500);
  }
});
```

### Step 3: Update Payment Callback Handler

```typescript
// Payment callback handler (for Zoho Payment Gateway response)
app.get("/make-server-a67f0635/payment/callback", async (c) => {
  try {
    // Zoho sends payment details as query params
    const zohoPaymentId = c.req.query('zoho_payment_id');
    const zohoOrderId = c.req.query('order_id');
    const zohoStatus = c.req.query('status');
    const zohoSignature = c.req.query('signature');
    
    console.log('💳 Payment callback from Zoho');
    console.log('Zoho Payment ID:', zohoPaymentId);
    console.log('Order ID:', zohoOrderId);
    console.log('Status:', zohoStatus);
    
    if (!zohoPaymentId || !zohoOrderId) {
      return c.json({ error: 'Missing required parameters' }, 400);
    }
    
    // Verify Zoho signature for security
    const signatureString = `${zohoPaymentId}${zohoOrderId}${zohoStatus}`;
    const expectedSignature = await crypto.subtle.sign(
      "HMAC",
      await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(Deno.env.get('ZOHO_API_SECRET')),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      ),
      new TextEncoder().encode(signatureString)
    );
    
    const expectedSignatureHex = Array.from(new Uint8Array(expectedSignature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    if (zohoSignature !== expectedSignatureHex) {
      console.error('❌ Invalid Zoho signature');
      return c.json({ error: 'Invalid signature' }, 400);
    }
    
    // Get order data
    const orderDataRaw = await kv.get(`order_${zohoOrderId}`);
    if (!orderDataRaw) {
      return c.json({ error: 'Order not found' }, 404);
    }
    
    const orderData = JSON.parse(orderDataRaw);
    
    // Get payment data
    const paymentDataRaw = await kv.get(`payment_${orderData.payment_id}`);
    if (!paymentDataRaw) {
      return c.json({ error: 'Payment not found' }, 404);
    }
    
    const paymentData = JSON.parse(paymentDataRaw);
    
    // Update based on Zoho status
    if (zohoStatus === 'success' || zohoStatus === 'captured') {
      paymentData.status = 'completed';
      paymentData.completed_at = new Date().toISOString();
      paymentData.zoho_payment_id = zohoPaymentId;
      
      orderData.payment_status = 'paid';
      orderData.status = 'confirmed';
      orderData.updated_at = new Date().toISOString();
      
      console.log('✅ Payment successful for order:', zohoOrderId);
    } else if (zohoStatus === 'failed') {
      paymentData.status = 'failed';
      paymentData.failed_at = new Date().toISOString();
      
      orderData.payment_status = 'failed';
      orderData.status = 'cancelled';
      orderData.updated_at = new Date().toISOString();
      
      console.log('❌ Payment failed for order:', zohoOrderId);
    }
    
    // Save updated data
    await kv.set(`payment_${orderData.payment_id}`, JSON.stringify(paymentData));
    await kv.set(`order_${zohoOrderId}`, JSON.stringify(orderData));
    
    // Redirect based on payment status
    const redirectUrl = zohoStatus === 'success' || zohoStatus === 'captured'
      ? `/order-success?orderId=${zohoOrderId}`
      : `/payment-failed?orderId=${zohoOrderId}`;
    
    return c.redirect(redirectUrl);
  } catch (error) {
    console.error('❌ Payment callback error:', error);
    return c.json({ 
      error: 'Failed to process payment callback', 
      details: error.message 
    }, 500);
  }
});
```

### Step 4: Add Webhook Handler

```typescript
// Webhook handler for Zoho Payment notifications
app.post("/make-server-a67f0635/payment/webhook", async (c) => {
  try {
    const payload = await c.req.json();
    const signature = c.req.header('X-Zoho-Signature');
    
    console.log('📨 Zoho webhook received:', payload.event);
    
    // Verify webhook signature
    const webhookString = JSON.stringify(payload);
    const expectedSignature = await crypto.subtle.sign(
      "HMAC",
      await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(Deno.env.get('ZOHO_API_SECRET')),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      ),
      new TextEncoder().encode(webhookString)
    );
    
    const expectedSignatureHex = Array.from(new Uint8Array(expectedSignature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    if (signature !== expectedSignatureHex) {
      console.error('❌ Invalid webhook signature');
      return c.json({ error: 'Invalid signature' }, 400);
    }
    
    // Handle different webhook events
    const { event, data } = payload;
    
    switch (event) {
      case 'payment.captured':
        // Payment successful
        await handlePaymentSuccess(data);
        break;
        
      case 'payment.failed':
        // Payment failed
        await handlePaymentFailure(data);
        break;
        
      case 'refund.processed':
        // Refund completed
        await handleRefund(data);
        break;
        
      default:
        console.log('⚠️ Unhandled webhook event:', event);
    }
    
    return c.json({ received: true });
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    return c.json({ 
      error: 'Failed to process webhook', 
      details: error.message 
    }, 500);
  }
});

// Helper functions for webhook events
async function handlePaymentSuccess(data: any) {
  const orderId = data.order_id;
  const orderDataRaw = await kv.get(`order_${orderId}`);
  
  if (orderDataRaw) {
    const orderData = JSON.parse(orderDataRaw);
    orderData.payment_status = 'paid';
    orderData.status = 'confirmed';
    orderData.updated_at = new Date().toISOString();
    
    await kv.set(`order_${orderId}`, JSON.stringify(orderData));
    
    // TODO: Send confirmation email to customer
    // TODO: Send notification to admin
    
    console.log('✅ Payment success processed for order:', orderId);
  }
}

async function handlePaymentFailure(data: any) {
  const orderId = data.order_id;
  const orderDataRaw = await kv.get(`order_${orderId}`);
  
  if (orderDataRaw) {
    const orderData = JSON.parse(orderDataRaw);
    orderData.payment_status = 'failed';
    orderData.status = 'cancelled';
    orderData.updated_at = new Date().toISOString();
    
    await kv.set(`order_${orderId}`, JSON.stringify(orderData));
    
    console.log('❌ Payment failure processed for order:', orderId);
  }
}

async function handleRefund(data: any) {
  const orderId = data.order_id;
  const orderDataRaw = await kv.get(`order_${orderId}`);
  
  if (orderDataRaw) {
    const orderData = JSON.parse(orderDataRaw);
    orderData.payment_status = 'refunded';
    orderData.refund_amount = data.amount;
    orderData.refund_processed_at = new Date().toISOString();
    orderData.updated_at = new Date().toISOString();
    
    await kv.set(`order_${orderId}`, JSON.stringify(orderData));
    
    console.log('✅ Refund processed for order:', orderId);
  }
}
```

---

## Testing

### Test Mode
Zoho Payments provides a test environment:

1. Use test API credentials from Zoho dashboard
2. Test card numbers provided by Zoho:
   - Success: 4111 1111 1111 1111
   - Failure: 4000 0000 0000 0002
3. Any future expiry date
4. Any CVV (e.g., 123)

### Testing Steps:
1. Place a test order
2. Use test card details at Zoho payment page
3. Verify order status updates correctly
4. Check webhook events are received
5. Verify customer sees correct order status

---

## Security Best Practices

1. **Never expose API secrets:**
   - Store in environment variables only
   - Never commit to version control
   - Use separate keys for test/production

2. **Always verify signatures:**
   - Verify all callback signatures
   - Verify all webhook signatures
   - Reject invalid signatures immediately

3. **Use HTTPS:**
   - All API calls must use HTTPS
   - Webhook URLs must be HTTPS

4. **Log everything:**
   - Log all payment attempts
   - Log all API responses
   - Monitor for unusual patterns

5. **Handle errors gracefully:**
   - Never expose internal errors to users
   - Provide helpful error messages
   - Retry failed API calls with exponential backoff

---

## Go-Live Checklist

- [ ] Zoho Payments account approved
- [ ] Production API credentials obtained
- [ ] Environment variables set in Supabase
- [ ] Payment creation endpoint updated
- [ ] Callback handler updated
- [ ] Webhook endpoint configured in Zoho
- [ ] Webhook handler implemented
- [ ] Test transactions completed successfully
- [ ] Error handling tested
- [ ] Security review completed
- [ ] SSL certificate active
- [ ] Monitoring and alerts configured
- [ ] Customer support team briefed

---

## Support Resources

- **Zoho Payments Documentation:** https://www.zoho.com/in/payment-gateway/developer/
- **Zoho Support:** support@zohopayments.com
- **Integration Support:** api-support@zoho.com

---

## Common Issues and Solutions

### Issue: "Invalid signature" error
**Solution:** 
- Verify ZOHO_API_SECRET is correct
- Ensure signature string format matches exactly
- Check for extra spaces or encoding issues

### Issue: Payment page doesn't load
**Solution:**
- Verify ZOHO_BASE_URL is correct
- Check API credentials are valid
- Ensure order amount is in correct format (paise)

### Issue: Webhook not receiving events
**Solution:**
- Verify webhook URL is accessible publicly
- Check webhook URL is HTTPS
- Verify webhook events are enabled in Zoho dashboard

### Issue: Order status not updating
**Solution:**
- Check database connection
- Verify order ID format matches
- Check logs for errors in callback handler

---

**Last Updated:** January 3, 2026
**Version:** 1.0
