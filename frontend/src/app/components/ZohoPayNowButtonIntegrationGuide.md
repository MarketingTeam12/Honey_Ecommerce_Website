# Zoho Pay Now Button - Integration Guide

## 🚀 Quick Start

### Basic Usage

```tsx
import { ZohoPayNowButton } from '@/app/components/ZohoPayNowButton';

function CheckoutPage() {
  return (
    <ZohoPayNowButton
      size="lg"
      text="Complete Payment"
    />
  );
}
```

## 📦 Component Variants

### 1. Primary Button (Recommended)

**ZohoPayNowButton** - Premium gradient button with animations

```tsx
<ZohoPayNowButton
  size="lg"                    // 'sm' | 'md' | 'lg'
  fullWidth={true}             // Full width on mobile
  text="Pay Now"               // Custom text
  showIcon={true}              // Show lock icon
  disabled={false}             // Disabled state
  onBeforeOpen={async () => {  // Before redirect
    console.log('Preparing...');
  }}
  onAfterOpen={() => {         // After redirect
    console.log('Opened!');
  }}
/>
```

### 2. Minimal Button

**ZohoPayNowButtonMinimal** - Outlined style for secondary actions

```tsx
import { ZohoPayNowButtonMinimal } from '@/app/components/ZohoPayNowButton';

<ZohoPayNowButtonMinimal
  text="Proceed to Payment"
  className="w-full"
/>
```

### 3. Icon Button

**ZohoPayNowIconButton** - Compact floating action button

```tsx
import { ZohoPayNowIconButton } from '@/app/components/ZohoPayNowButton';

<ZohoPayNowIconButton />
```

## 🎨 Size Variants

| Size | Use Case | Padding |
|------|----------|---------|
| `sm` | Compact areas, inline actions | `px-4 py-2` |
| `md` | Default, most common | `px-6 py-3` |
| `lg` | Checkout pages, CTAs | `px-8 py-4` |

## 💡 Real-World Examples

### Checkout Page

```tsx
import { ZohoPayNowButton } from '@/app/components/ZohoPayNowButton';

function CheckoutPage() {
  const total = 2360;
  
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <div className="mb-4">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>₹2,000</span>
        </div>
        <div className="flex justify-between">
          <span>Tax (18%)</span>
          <span>₹360</span>
        </div>
        <div className="flex justify-between font-bold text-lg mt-2">
          <span>Total</span>
          <span>₹{total}</span>
        </div>
      </div>
      
      <ZohoPayNowButton
        size="lg"
        fullWidth
        text={`Pay ₹${total} Now`}
        onBeforeOpen={async () => {
          // Validate cart
          // Save order to database
          // Track analytics
        }}
        onAfterOpen={() => {
          // Show confirmation message
          // Update UI state
        }}
      />
    </div>
  );
}
```

### Product Page

```tsx
<div className="flex gap-3">
  <button className="flex-1 border-2 border-gray-300 rounded-lg py-3">
    Add to Cart
  </button>
  
  <ZohoPayNowButton
    className="flex-1"
    text="Buy Now"
  />
</div>
```

### Cart Page

```tsx
<div className="sticky bottom-0 bg-white p-4 shadow-lg">
  <ZohoPayNowButton
    size="lg"
    fullWidth
    text={`Checkout (${itemCount} items)`}
    disabled={cart.length === 0}
  />
</div>
```

## 🔒 Security Features

✅ Opens in new tab with `_blank` target  
✅ Uses `noopener,noreferrer` security parameters  
✅ Prevents popup blocking detection  
✅ Secure SSL connection to Zoho Payments  
✅ No sensitive data in URL parameters  

## ♿ Accessibility

✅ Proper semantic HTML (`<button>`)  
✅ ARIA labels for screen readers  
✅ Keyboard navigation support  
✅ Focus states and outlines  
✅ Disabled state handling  
✅ Loading state indicators  

## 🎯 Callbacks

### onBeforeOpen (async)

Execute logic BEFORE opening payment page:

```tsx
onBeforeOpen={async () => {
  // 1. Validate form data
  if (!isFormValid()) {
    throw new Error('Invalid data');
  }
  
  // 2. Save order to database
  await saveOrder({
    userId: user.id,
    total: cartTotal,
    items: cartItems
  });
  
  // 3. Track analytics
  analytics.track('payment_initiated', {
    amount: cartTotal,
    currency: 'INR'
  });
}}
```

### onAfterOpen

Execute logic AFTER opening payment page:

```tsx
onAfterOpen={() => {
  // 1. Show confirmation toast
  toast.success('Redirected to secure payment gateway');
  
  // 2. Update UI state
  setPaymentStatus('pending');
  
  // 3. Clear cart (optional)
  // clearCart();
  
  // 4. Track event
  console.log('User redirected to Zoho Payments');
}}
```

## 🎨 Customization

### Custom Styling

```tsx
<ZohoPayNowButton
  className="shadow-2xl hover:shadow-3xl custom-class"
  size="lg"
/>
```

### Custom Colors

Override with Tailwind:

```tsx
<ZohoPayNowButton
  className="from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
/>
```

### Custom Text & Icon

```tsx
<ZohoPayNowButton
  text="Complete Secure Payment"
  showIcon={false}
  size="lg"
/>
```

## 📱 Responsive Design

All buttons are mobile-optimized:

```tsx
// Desktop: Normal size
// Mobile: Full width option
<ZohoPayNowButton
  size="lg"
  fullWidth  // Expands to full width on mobile
/>
```

## 🔧 Error Handling

Built-in error handling:

- Popup blocker detection
- Fallback alerts
- Console logging
- Graceful degradation

## 🧪 Testing

Test the button functionality:

1. Click button
2. Verify new tab opens
3. Check URL: `https://www.zoho.com/us/payments/`
4. Confirm `noopener,noreferrer` in DevTools
5. Test on mobile devices
6. Test with popup blockers

## 📍 Demo Page

Visit `/zoho-payment-demo` to see all variants in action.

## 🔗 Payment Flow

```
User clicks "Pay Now"
    ↓
onBeforeOpen() executes
    ↓
Validates & saves order
    ↓
Opens Zoho Payments (new tab)
    ↓
onAfterOpen() executes
    ↓
User completes payment on Zoho
    ↓
Returns to success page
```

## 💼 Production Checklist

- [ ] Button integrated in checkout flow
- [ ] Callbacks configured
- [ ] Error handling tested
- [ ] Mobile responsiveness verified
- [ ] Accessibility tested
- [ ] Analytics tracking added
- [ ] User tested on real devices
- [ ] Popup blocker handling tested

## 🚨 Common Issues

### Popup Blocked

**Solution**: Browser automatically shows alert to enable popups

### Button Not Clicking

**Solution**: Check if `disabled` prop is set

### Callback Not Firing

**Solution**: Ensure async/await syntax is correct

## 📞 Support

For issues or questions:
1. Check the demo page: `/zoho-payment-demo`
2. Review console logs
3. Verify Zoho Payments URL is accessible
