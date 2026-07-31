# 🚀 Quick Start Testing Guide

## Complete Order Flow Test - Step by Step

This guide will walk you through testing the complete order flow from customer perspective and admin perspective.

---

## 🧪 Test Scenario: Order a Saudi Apostille Service

### Part 1: Customer Places Order (15 minutes)

#### Step 1: Sign In as Customer
1. Navigate to the website homepage
2. Click "Sign In" in the header
3. Use credentials:
   - Email: `customer@example.com`
   - Password: `customer123`
4. ✅ **Expected:** Successfully signed in, redirected to homepage

---

#### Step 2: Browse and Select Service
1. From homepage, scroll to "Pick Your Apostille" section
2. Click on "Saudi Apostille" card
3. ✅ **Expected:** Navigate to product page

---

#### Step 3: Configure Service
1. On Saudi Apostille product page:
   - Upload a test document (PDF)
   - Set number of pages: **5**
   - Select any additional options if available
2. Review calculated price
3. Click "Add to Cart"
4. ✅ **Expected:** Success message, cart count updates in header

---

#### Step 4: Review Cart
1. Click cart icon in header OR navigate to `/cart`
2. Verify:
   - Saudi Apostille service is listed
   - 5 pages shown
   - Total price calculated correctly
3. Update page count to **10** (test update functionality)
4. ✅ **Expected:** Price updates automatically
5. Click "Proceed to Checkout"

---

#### Step 5: Checkout - Address
1. On address page (`/checkout/address`):
   - Select an existing address (default selected)
   - OR click "Add New Address" to add one
2. Try applying coupon:
   - Enter: `HONEY10`
   - Click "Apply"
   - ✅ **Expected:** 10% discount applied
3. Review order summary on right side
4. Click "Continue to Review"

---

#### Step 6: Checkout - Review
1. On review page (`/checkout/review`):
   - Verify all items are correct
   - Check billing address
   - Review final amount with discount
2. ✅ **Expected:** All information matches
3. Click "Continue to Payment"

---

#### Step 7: Payment
1. On payment page (`/checkout/payment`):
   - Select payment method: **Credit Card**
   - Review order summary (subtotal, discount, tax, total)
2. Click "Pay Now"
3. ✅ **Expected:** 
   - "Processing payment..." message appears
   - After ~2.5 seconds, redirected to success page

---

#### Step 8: Order Success
1. On success page (`/order-success?orderId=...`):
   - Note the **Order ID** (e.g., ORD-1735919234-ABC123)
   - Verify order details are correct
   - Check order items list
   - Review "What happens next" section
2. Click "View My Orders" button

---

#### Step 9: Track Order
1. On My Orders page (`/my-orders`):
   - Find your recent order
   - Verify order card shows:
     - Order number
     - Date
     - Total amount
     - Status badge: **"Order Placed"** (yellow)
   - Check order tracking timeline:
     - ✅ Order Placed (completed - green)
     - ⏳ Confirmed (pending - gray)
     - ⏳ Processing (pending - gray)
     - ⏳ Shipped (pending - gray)
     - ⏳ Delivered (pending - gray)
2. Click "View Details" button
3. ✅ **Expected:** Modal opens with complete order information

---

### Part 2: Admin Manages Order (10 minutes)

#### Step 10: Sign In as Admin
1. **Important:** Open a NEW browser window or incognito window
2. Navigate to `/admin` OR `/signin`
3. Use admin credentials:
   - Email: `admin@honeytranslations.com`
   - Password: `admin123`
4. ✅ **Expected:** Admin dashboard loads

---

#### Step 11: View Sales Dashboard
1. On admin dashboard, click "Sales" in sidebar
2. Verify statistics cards show:
   - Total Orders: **Increased by 1**
   - Pending Orders: **Increased by 1**
   - Revenue shown
3. ✅ **Expected:** Your test order appears in the list

---

#### Step 12: Find Your Test Order
1. In the orders table:
   - Find order by Order ID (from Step 8)
   - OR filter by "Pending" status
2. Verify order shows:
   - Customer name
   - Order date (today)
   - Total amount
   - Status: **Pending** (yellow badge)
   - Payment Status: **Pending** or **Paid**
3. ✅ **Expected:** Order visible with correct details

---

#### Step 13: View Order Details
1. Click the "Eye" icon (View Details) for your order
2. Modal opens showing:
   - Customer Information (name, email)
   - Order Information (date, payment method, status)
   - Order Items (Saudi Apostille, 10 pages)
   - Order Summary (subtotal, discount, tax, total)
3. ✅ **Expected:** All information matches what customer entered
4. Close modal (click X or outside)

---

#### Step 14: Update to "Confirmed"
1. Click the "Edit" icon (Update Status) for your order
2. Status update modal opens
3. Select status: **Confirmed**
4. Click "Update Status"
5. ✅ **Expected:** 
   - Success message appears
   - Order status badge updates to "Confirmed" (blue)
   - Page refreshes with updated data

---

#### Step 15: Update to "Processing"
1. Click "Edit" icon again
2. Select status: **Processing**
3. Click "Update Status"
4. ✅ **Expected:** Status updates to "Processing" (blue badge)

---

#### Step 16: Update to "Shipped" (with Tracking)
1. Click "Edit" icon again
2. Select status: **Shipped**
3. ✅ **Expected:** Additional fields appear:
   - Tracking Number
   - Shipping Carrier
4. Fill in:
   - Tracking Number: `TRK123456789`
   - Shipping Carrier: `FedEx`
5. Click "Update Status"
6. ✅ **Expected:** 
   - Status updates to "Shipped" (purple badge)
   - Tracking info saved

---

#### Step 17: Update to "Delivered"
1. Click "Edit" icon one more time
2. Select status: **Delivered**
3. Click "Update Status"
4. ✅ **Expected:** 
   - Status updates to "Delivered" (green badge)
   - Payment status auto-updates to "Paid"
   - Dashboard statistics update (Delivered count increases)

---

### Part 3: Customer Sees Updates (5 minutes)

#### Step 18: Return to Customer View
1. Switch back to customer browser window/tab
2. Refresh the "My Orders" page
3. ✅ **Expected:** Order card now shows:
   - Status badge: **"Delivered"** (green)
   - Tracking information visible with number and carrier

---

#### Step 19: Check Order Timeline
1. Scroll to order tracking timeline
2. ✅ **Expected:** All steps are now completed (green):
   - ✅ Order Placed - [Date]
   - ✅ Confirmed - [Date]
   - ✅ Processing - [Date]
   - ✅ Shipped - [Date] (with tracking: TRK123456789)
   - ✅ Delivered - [Date]

---

#### Step 20: Verify Order Details
1. Click "View Details" on the order
2. Modal shows:
   - Order Status: **Delivered** (green badge)
   - Payment Status: **Paid** (green badge)
   - All items and pricing
3. ✅ **Expected:** Order complete!

---

## ✅ Test Completion Checklist

Mark each as you complete:

### Customer Flow:
- [ ] Signed in successfully
- [ ] Selected and configured product
- [ ] Added to cart
- [ ] Applied coupon discount
- [ ] Completed checkout (address, review, payment)
- [ ] Saw order success page
- [ ] Tracked order in "My Orders"
- [ ] Saw order tracking timeline

### Admin Flow:
- [ ] Signed in as admin
- [ ] Viewed sales dashboard
- [ ] Found test order
- [ ] Viewed order details
- [ ] Updated status: Pending → Confirmed
- [ ] Updated status: Confirmed → Processing
- [ ] Updated status: Processing → Shipped (added tracking)
- [ ] Updated status: Shipped → Delivered
- [ ] Verified statistics updated

### Integration:
- [ ] Customer saw status updates in real-time
- [ ] Tracking number displayed correctly
- [ ] Order timeline showed all completed steps
- [ ] All data persisted correctly
- [ ] No errors in browser console

---

## 🐛 Common Issues & Solutions

### Issue: Can't sign in
**Solution:** 
- Verify you're using correct credentials
- Check browser console for errors
- Try clearing localStorage and cookies

### Issue: Cart is empty after adding item
**Solution:** 
- Check if you're signed in
- Verify browser console for errors
- Try refreshing the page

### Issue: Order not showing in admin
**Solution:** 
- Refresh the admin sales page
- Check filter (try "All Orders")
- Verify you completed payment step

### Issue: Status update doesn't save
**Solution:** 
- Check you're signed in as admin
- Verify browser console for errors
- Try a different status first

### Issue: Tracking timeline not updating
**Solution:** 
- Refresh the "My Orders" page
- Clear browser cache
- Verify order status was updated by admin

---

## 📱 Testing on Different Devices

### Desktop (Chrome/Firefox/Safari)
- Test full flow as described above
- Verify all modals work correctly
- Check responsive design

### Tablet (iPad/Android)
- Test navigation
- Verify touch interactions
- Check layout responsiveness

### Mobile (iPhone/Android)
- Test complete flow on small screen
- Verify forms are usable
- Check order tracking timeline on mobile

---

## 🎯 Advanced Testing Scenarios

### Scenario 1: Multiple Items Order
1. Add 3 different services to cart
2. Apply coupon
3. Complete checkout
4. Verify all items show correctly

### Scenario 2: Order Cancellation
1. Place an order
2. Admin updates status to "Cancelled"
3. Verify customer sees cancelled status
4. Check timeline shows cancellation

### Scenario 3: Multiple Orders
1. Place 3 separate orders
2. Verify all show in "My Orders"
3. Check admin sees all orders
4. Update each to different statuses

### Scenario 4: No Coupon
1. Complete order without applying coupon
2. Verify pricing is correct (no discount)

### Scenario 5: Different Payment Methods
1. Test with UPI
2. Test with Net Banking
3. Test with Wallet
4. Verify all work correctly

---

## 📊 What to Verify

### Data Accuracy:
✅ Order ID format correct (ORD-timestamp-random)
✅ Dates and timestamps accurate
✅ Pricing calculations correct (base price × pages)
✅ Discount applied correctly
✅ Tax calculated at 18%
✅ Total amount matches

### Status Flow:
✅ Status progression logical
✅ Timestamps set correctly
✅ Customer sees same status as admin set
✅ Visual indicators correct (colors, icons)

### User Experience:
✅ Pages load quickly
✅ No errors in console
✅ Smooth transitions
✅ Clear instructions
✅ Helpful error messages

---

## 🎉 Test Success Criteria

Your implementation is successful if:
- ✅ Customer can complete entire order flow
- ✅ Order appears in admin dashboard
- ✅ Admin can update order status
- ✅ Customer sees status updates immediately
- ✅ All data persists correctly
- ✅ No errors occur during flow
- ✅ UI/UX is smooth and professional

---

## 📞 Need Help?

If you encounter any issues:
1. Check browser console for errors
2. Review documentation files
3. Verify demo credentials are correct
4. Clear browser cache and try again

---

**Happy Testing! 🚀**

---

**Test Duration:** ~30 minutes for complete flow
**Last Updated:** January 3, 2026
