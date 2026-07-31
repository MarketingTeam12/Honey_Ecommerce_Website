# Coupon System - Quick Start Guide

## 🎯 For Administrators

### Creating a New Coupon

1. **Navigate to Admin Panel**
   - Go to `/admin/coupons` or click "Coupons" in the admin sidebar

2. **Click "Add Coupon" Button**
   - Located in the top-right corner of the page

3. **Fill in the Coupon Form**
   - **Coupon Code**: Enter a memorable code (e.g., "SAVE20", "WELCOME10")
   - **Discount Type**: Choose "Percentage (%)" or "Fixed Amount (₹)"
   - **Discount Value**: Enter the discount amount
   - **Min Order Value** *(optional)*: Set minimum cart value required
   - **Max Discount** *(optional)*: Cap maximum discount for percentage coupons
   - **Usage Limit** *(optional)*: Set how many times the coupon can be used
   - **Valid From** *(optional)*: Set start date
   - **Valid Until** *(optional)*: Set expiration date
   - **Description**: Brief description of the offer
   - **Active**: Check to make the coupon active immediately

4. **Click "Create Coupon"**
   - The coupon will be saved and immediately available to customers

### Editing a Coupon

1. Click the **Edit (pencil icon)** button next to any coupon
2. Modify the details in the form
3. Click "Update Coupon"

### Deactivating a Coupon

- Click the **yellow X icon** next to an active coupon
- The coupon will be deactivated but not deleted
- Click the **green checkmark** to reactivate

### Deleting a Coupon

- Click the **red trash icon** next to any coupon
- Confirm the deletion
- ⚠️ This action cannot be undone

### Copying Coupon Codes

- Click the **copy icon** next to any coupon code
- The code is copied to clipboard
- Share with customers via email or social media

---

## 🛒 For Customers

### Applying a Coupon on Cart Page

#### Method 1: Manual Entry
1. Add items to your cart
2. Scroll to the "Order Summary" section
3. Enter coupon code in the input field
4. Click "Apply" button
5. ✅ Discount will be applied if valid

#### Method 2: Browse Available Coupons
1. In the Order Summary, scroll down to see "Available coupons"
2. Click on any coupon card to apply it instantly
3. ✅ Discount will be applied automatically

#### Method 3: Show All Coupons Modal
1. Click the purple "Show All Coupons" button
2. Browse all available coupons in a beautiful modal
3. Click anywhere on a coupon card to apply it
4. The modal closes and discount is applied

### Removing an Applied Coupon

1. Look for the green coupon badge in Order Summary
2. Click the red **X** icon next to the coupon code
3. The coupon will be removed and total recalculated

---

## 📋 Pre-configured Demo Coupons

Try these coupons right away:

### 🎁 WELCOME10
- **10% OFF** your entire order
- Minimum order: ₹1,000
- Max discount: ₹500
- Perfect for new customers!

### 💰 SAVE500
- **Flat ₹500 OFF**
- Minimum order: ₹5,000
- Best for large orders!

### 🌸 SPRING20
- **20% OFF** spring special
- Minimum order: ₹2,000
- Max discount: ₹1,000
- Valid until June 30, 2026

---

## ✅ What to Check After Applying a Coupon

In the Order Summary, you should see:

1. **Subtotal**: Your cart total before discount
2. **Discount (COUPON_CODE)**: The discount amount in green
3. **Tax (GST 18%)**: Calculated on discounted amount
4. **Total**: Final amount after discount and tax

---

## ❌ Common Error Messages & Solutions

| Error Message | What It Means | Solution |
|--------------|---------------|----------|
| "Invalid coupon code" | Code doesn't exist | Check spelling and try again |
| "This coupon is not active" | Coupon is disabled | Try a different coupon |
| "This coupon requires a minimum order of ₹X" | Cart value too low | Add more items to your cart |
| "This coupon has reached its usage limit" | Coupon fully used | Try a different coupon |
| "This coupon has expired" | Past expiry date | Try a different coupon |

---

## 🔍 Debug Mode (For Testing)

On the Cart page, click the "Show Debug Info" button to see:
- How many coupons are loaded
- Raw coupon data from storage
- List of available coupon codes
- Reload coupons button

This helps troubleshoot any issues with coupon loading.

---

## 💡 Pro Tips

### For Admins:
- ✨ Use clear, memorable coupon codes (e.g., "SAVE20" not "XYZ123")
- 📅 Set expiry dates to create urgency
- 💵 Use max discount caps to control costs on percentage coupons
- 📊 Monitor usage statistics to measure campaign success
- 🎯 Create targeted coupons for specific campaigns

### For Customers:
- 🔔 Check the "Show All Coupons" button regularly for new offers
- 💰 Compare different coupons to get the best deal
- 📦 Try reaching minimum order requirements for better discounts
- 🎁 Use percentage coupons on high-value orders
- 💵 Use fixed amount coupons on orders near minimum value

---

## 🎨 Visual Indicators

### In Admin Panel:
- 🟢 **Green Badge**: Active coupon
- ⚫ **Gray Badge**: Inactive coupon
- 🔴 **Red Badge**: Expired coupon
- 📊 **Blue Progress Bar**: Usage tracking

### On Cart/Checkout:
- 🟢 **Green Box**: Applied coupon (success)
- 🔴 **Red Text**: Error message
- 💜 **Purple Button**: Show all coupons
- 🔵 **Blue Border**: Clickable coupon card

---

## 📞 Need Help?

If you encounter any issues:
1. Try refreshing the page
2. Clear browser cache
3. Enable debug mode to check if coupons are loading
4. Contact support with specific error messages

---

## 🚀 Next Steps

### For Admins:
1. Create your first custom coupon
2. Set appropriate min/max values
3. Share coupon codes with customers
4. Monitor usage in the admin panel
5. Adjust campaigns based on performance

### For Customers:
1. Browse available coupons
2. Add items to cart
3. Apply the best coupon for your order
4. Complete checkout with savings! 🎉

---

**Enjoy your savings with Honey Translation Services!** 🍯
