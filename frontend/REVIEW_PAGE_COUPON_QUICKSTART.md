# Quick Start: Coupon Feature on Review Order Page

## 🎯 What's New?

The **Review Order & Make Payment** page (`/checkout/review`) now has full coupon functionality! Customers can apply discount coupons before making payment.

---

## 🚀 For End Users (Customers)

### **How to Apply a Coupon**

**Method 1: Browse Available Coupons**

1. Go to checkout and complete the address page
2. On the "Review Order & Make Payment" page, scroll to the "Apply Coupon Code" section
3. Click the **"View All Available Coupons"** button
4. A beautiful modal will open showing all coupons you can use
5. Find a coupon that meets your cart requirements
6. Click **"Apply This Coupon"** on the coupon card
7. Done! The discount is applied instantly

**Method 2: Enter Coupon Code Manually**

1. On the "Review Order & Make Payment" page, find the coupon section
2. Type the coupon code in the input field (e.g., "WELCOME10")
3. Click the **"Apply"** button
4. If valid, you'll see a success message and your savings!

### **What You'll See**

After applying a coupon:
- ✅ Green success banner with coupon code
- ✅ Discount amount in order summary
- ✅ Total savings message ("You're saving ₹XXX!")
- ✅ Updated final total

### **How to Remove a Coupon**

1. Click the **X** button on the green coupon banner
2. Or click **"Remove"** if available
3. The coupon will be removed and prices updated

---

## 👨‍💼 For Admins

### **How Coupons Work**

1. **Create Coupons** in the Admin Panel (`/admin/coupons`)
2. **Coupons Automatically Appear** on the Review Order page
3. **Only Active Coupons** are shown to customers
4. **Usage is Tracked** when payments are completed

### **Coupon Visibility Rules**

A coupon appears on the Review Order page ONLY if:
- ✅ Status is "Active" (not "Inactive")
- ✅ Current date is within validity period (not expired)
- ✅ Usage limit is not reached
- ✅ All other conditions are met

### **Testing Coupons**

1. Go to **Admin Panel → Coupons**
2. Create a test coupon:
   - Code: `TEST10`
   - Type: Percentage
   - Value: 10
   - Min Order: 1000
   - Status: Active
3. Add items worth ₹1,000+ to cart
4. Go to Review Order page
5. Click "View All Available Coupons"
6. You should see `TEST10` in the list
7. Apply it and verify the 10% discount

---

## 📋 Quick Checklist

### **Customer Experience**
- [ ] Coupon section is visible on Review Order page
- [ ] "View All Available Coupons" button works
- [ ] Modal opens and shows active coupons
- [ ] Can apply coupon from modal
- [ ] Can apply coupon manually
- [ ] Applied coupon shows in green banner
- [ ] Discount appears in order summary
- [ ] Can remove applied coupon
- [ ] Final total reflects discount

### **Admin Panel Sync**
- [ ] New coupons appear immediately
- [ ] Inactive coupons are hidden
- [ ] Expired coupons don't show
- [ ] Fully used coupons are filtered out
- [ ] Updated values reflect correctly

---

## 💡 Common Questions

### **Q: Why can't I apply a coupon?**
**A:** Check these reasons:
- Cart total is below the minimum order value
- Coupon has reached its usage limit
- Coupon has expired
- Coupon is inactive in admin panel

### **Q: Does the coupon persist if I go back?**
**A:** Yes! The applied coupon stays active throughout the checkout process.

### **Q: Can I apply multiple coupons?**
**A:** No, only one coupon can be applied at a time. You can remove and apply a different one.

### **Q: Will the coupon work on the payment page?**
**A:** Yes! The discount is carried forward to the payment page and applied to your final bill.

### **Q: How do I know how much I'm saving?**
**A:** After applying a coupon, you'll see:
- Discount line in order summary
- "You're saving ₹XXX" message in the green banner
- Updated final total

---

## 🎨 Visual Guide

### **Before Applying Coupon**
```
┌─────────────────────────────────┐
│ Apply Coupon Code                │
│                                  │
│ [Enter coupon code...  ] [Apply]│
│                                  │
│ 🏷️ View All Available Coupons (3)│
└─────────────────────────────────┘

Order Summary:
Subtotal:     ₹2,000
Tax (18%):    ₹360
Total:        ₹2,360
```

### **After Applying Coupon**
```
┌─────────────────────────────────┐
│ Apply Coupon Code                │
│                                  │
│ ┌─────────────────────────────┐ │
│ │ ✓ Coupon Applied!        × │ │
│ │ Code: WELCOME10            │ │
│ │ ────────────────────────── │ │
│ │ You're saving ₹200!        │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘

Order Summary:
Subtotal:     ₹2,000
Discount:     - ₹200  ← NEW!
Tax (18%):    ₹324
Total:        ₹2,124  ← SAVED ₹236!
```

---

## 🔧 Troubleshooting

### **Coupon doesn't appear in modal**
- Check if it's active in admin panel
- Verify the expiry date hasn't passed
- Confirm usage limit isn't reached
- Refresh the page and try again

### **Error: "Minimum order value required"**
- Add more items to cart
- Or use a different coupon with lower minimum

### **Applied coupon disappeared**
- May have been deactivated by admin
- Could have reached usage limit
- Check if it expired
- Re-apply if still valid

---

## ✅ Success Indicators

You know it's working when:
- ✅ Green banner shows applied coupon
- ✅ Discount line appears in order summary
- ✅ Final total is reduced by discount amount
- ✅ Can see all active coupons in modal
- ✅ Invalid coupons show clear error messages

---

## 📞 Support

If coupons aren't working:
1. Clear browser cache and reload
2. Check admin panel for coupon status
3. Verify all coupon parameters are correct
4. Test with a simple coupon (no restrictions)
5. Check browser console for errors

---

**Happy Shopping! 🎉**

Enjoy your savings with our coupon system!
