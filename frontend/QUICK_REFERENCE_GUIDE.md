# Honey Translation Services - Quick Reference Guide

## 🚀 QUICK START

### For New Users
```
1. Visit: http://localhost:5173 (or your deployed URL)
2. Browse services on homepage
3. Click any service to view details
4. Configure options (language, document type, upload file)
5. Click "Add to Cart"
6. Complete checkout process
```

### For Admins
```
1. Navigate to /signin
2. Login with: admin@honeytranslations.com / admin123
3. Access admin panel at /admin
4. Manage orders, customers, products, etc.
```

## 📍 KEY URLS

### Public Pages
| Page | URL | Description |
|------|-----|-------------|
| Homepage | `/` | Main landing page with 17 sections |
| All Translations | `/translation-products` | Translation services listing |
| All Apostille | `/apostille-products` | Apostille services listing |
| All Attestation | `/attestation-products` | Attestation services listing |
| All Startups | `/startup-products` | Startup packages listing |
| Cart | `/cart` | Shopping cart with coupon support |
| Checkout | `/checkout/address` | 3-step checkout process |
| Track Order | `/track-order` | Order tracking by order ID |
| Contact | `/contact-us` | Contact form |
| FAQ | `/faq` | Frequently asked questions |

### Service Pages (Translation)
| Service | URL |
|---------|-----|
| English → Foreign Language | `/english-to-foreign-language` |
| Foreign Language → English | `/foreign-language-to-english` |
| English → Indian Language | `/english-to-any-indian-language` |
| Indian Language → English | `/any-indian-language-to-english` |

### Service Pages (Attestation)
| Service | URL |
|---------|-----|
| UAE Attestation | `/uae-attestation` |
| China Attestation | `/china-attestation` |
| Qatar Attestation | `/qatar-attestation` |
| Kuwait Attestation | `/kuwait-attestation` |
| HRD Attestation (TN) | `/hrd-attestation-tn` |

### Service Pages (Startup Packages)
| Package | URL |
|---------|-----|
| Basic Package | `/basic-startup-package` |
| Standard Package | `/standard-startup-package` |
| Premium Package | `/premium-startup-package` |

### Admin Pages
| Page | URL | Description |
|------|-----|-------------|
| Dashboard | `/admin` | Overview and statistics |
| Orders | `/admin/orders` | Order management |
| Order Detail | `/admin/orders/:orderId` | Individual order view |
| Customers | `/admin/customers` | Customer database |
| Products | `/admin/items` | Product/service management |
| Add Product | `/admin/items/new` | Create new product |
| Edit Product | `/admin/items/edit/:id` | Edit existing product |
| Coupons | `/admin/coupons` | Coupon code management |
| Categories | `/admin/categories` | Category management |
| Sales | `/admin/sales` | Sales analytics |
| Reports | `/admin/reports` | Business reports |
| Notifications | `/admin/notifications` | System notifications |
| Work Samples | `/admin/work-samples` | Portfolio management |
| API Keys | `/admin/api-keys` | API configuration |

### Debug/Setup Pages
| Page | URL | Description |
|------|-----|-------------|
| Storage Setup | `/storage-setup` | Storage bucket diagnostics |
| Database Diagnostics | `/debug/database` | Database connection test |
| Edge Function Help | `/debug/edge-function` | Backend diagnostics |
| Init Demo | `/init-demo` | Initialize demo users |

## 💰 PRICING REFERENCE

### Translation Services (Original: ₹2,000)

#### English → Foreign Language
| Language | Offer Price |
|----------|------------|
| Dutch | ₹900 |
| Arabic | ₹900 |
| Italian | ₹800 |
| Japanese | ₹1,400 |
| French | ₹800 |
| Russian | ₹800 |
| Polish | ₹800 |
| Chinese | ₹1,000 |
| Spanish | ₹800 |
| Portuguese | ₹800 |
| Korean | ₹1,800 |
| Greek | ₹1,050 |
| Indonesian | ₹800 |

#### Foreign Language → English
| Language | Offer Price |
|----------|------------|
| Dutch | ₹900 |
| Arabic | ₹900 |
| Italian | ₹800 |
| Japanese | ₹1,050 |
| French | ₹800 |
| Russian | ₹800 |
| Polish | ₹900 |
| Chinese | ₹1,000 |
| Spanish | ₹800 |
| Czech | ₹900 |
| Portuguese | ₹800 |
| Korean | ₹1,050 |
| Greek | ₹900 |
| Indonesian | ₹900 |

#### English ↔ Indian Language
| Language | Offer Price (Both Directions) |
|----------|-------------------------------|
| Assamese | ₹600 |
| Bengali | ₹600 |
| Konkani | ₹600 |
| Hindi | ₹600 |
| Gujarati | ₹600 |
| Rajasthani | ₹600 |
| Marathi | ₹600 |
| Malayalam | ₹600 |
| Odia | ₹700 |
| Telugu | ₹600 |
| Punjabi | ₹600 |
| Urdu | ₹1,100 |
| Kannada | ₹600 |
| Tamil | ₹600 |
| Sanskrit | ₹600 |

### Sworn Translation (Original: ₹5,000)
| Language Pair | Offer Price |
|--------------|------------|
| English ↔ Spanish | ₹3,299 |
| English ↔ Italian | ₹1,499 |
| English ↔ German | ₹4,299 |
| English ↔ French | ₹3,300 |

### Apostille Services
- **Original**: ₹3,500
- **Offer**: ₹2,500 (all countries)

### Attestation Services
| Country | Original | Offer |
|---------|----------|-------|
| China | ₹18,000 | ₹16,000 |
| Qatar | ₹12,000 | ₹9,500 |
| Kuwait | ₹19,000 | ₹16,000 |
| UAE | ₹13,000 | ₹9,500 |
| HRD (TN) | ₹5,000 | ₹2,500 |

### Startup Packages

#### Basic Package
| Duration | Original | Offer |
|----------|----------|-------|
| Full Package | ₹25,999 | ₹17,999 |
| 1 Year | ₹25,999 | ₹12,999 |
| 2 Years | ₹25,999 | ₹22,999 |

#### Standard Package
| Duration | Original | Offer |
|----------|----------|-------|
| Full Package | ₹38,999 | ₹32,999 |
| 1 Year | ₹38,999 | ₹18,999 |
| 2 Years | ₹38,999 | ₹36,999 |

#### Premium Package
| Duration | Original | Offer |
|----------|----------|-------|
| Full Package | ₹73,999 | ₹65,999 |
| 1 Year | ₹73,999 | ₹38,999 |
| 2 Years | ₹73,999 | ₹73,999 |

## 🛠️ COMMON TASKS

### Add a New Translation Service
```typescript
// 1. Edit /src/app/data/translationProductData.ts
'new-service-slug': createTranslationProductData({
  title: 'New Service Name',
  price: 800,
  originalPrice: 2000,
  sourceLanguages: [...],
  targetLanguages: [...],
  relatedProducts: [...]
}),

// 2. Add route in /src/app/App.tsx
<Route path="/new-service-slug" element={<PublicLayout><DirectProductPage /></PublicLayout>} />
```

### Add a New Pricing Tier
```typescript
// Edit /src/app/components/product/ProductTemplate.tsx
// Add to appropriate pricing constant (lines 32-148)

const NEW_PRICING: { [key: string]: number } = {
  'language': price,
  // ...
};

// Update getDynamicPrice() function to include new pricing logic
```

### Create a Custom Coupon
```typescript
// Use couponService in /src/app/services/couponService.ts
const newCoupon = {
  code: 'SPECIAL10',
  discountType: 'percentage', // or 'fixed'
  discountValue: 10,
  minOrderValue: 1000,
  maxUses: 100,
  validFrom: new Date('2026-03-01'),
  validUntil: new Date('2026-03-31'),
  active: true
};

// Add via admin panel at /admin/coupons
```

### Update Product Images
```typescript
// Option 1: Upload via Admin Panel
// 1. Go to /admin/items
// 2. Click edit on product
// 3. Upload new images
// 4. Save changes

// Option 2: Programmatically
// Images are fetched from Supabase Storage
// Upload to storage bucket and update product record
```

### Modify Homepage Sections
```typescript
// Edit components in /src/app/components/home/
// Example: HeroSection.tsx

export function HeroSection() {
  return (
    <section className="...">
      {/* Your custom content */}
    </section>
  );
}

// Import and use in /src/app/pages/HomePage.tsx
```

## 🔍 DEBUGGING TIPS

### Cart Issues
```javascript
// Check cart state in browser console
localStorage.getItem('honey_cart')

// Clear cart
localStorage.removeItem('honey_cart')

// Check CartContext
// Open React DevTools → Components → CartProvider
```

### Authentication Issues
```javascript
// Check auth state
localStorage.getItem('honey_auth')

// Clear auth
localStorage.removeItem('honey_auth')

// Check for JWT token
// Should be sent in Authorization header: Bearer {token}
```

### Pricing Not Updating
```typescript
// Check if language pair exists in pricing constants
// ProductTemplate.tsx lines 32-111

// Verify getDynamicPrice() function is being called
console.log('Current price:', currentPrice);
console.log('Source:', sourceLanguage, 'Target:', targetLanguage);
```

### File Upload Issues
```typescript
// Check file size (max 7MB)
// Check file type (PDF, JPG, PNG)
// Check storage bucket exists: documents-a67f0635

// Test storage setup at /storage-setup
```

### Backend Connection Issues
```typescript
// 1. Check Edge Function URL
const url = `https://${projectId}.supabase.co/functions/v1/make-server-a67f0635/route`;

// 2. Verify JWT token in headers
const headers = buildHeaders(accessToken);

// 3. Check Edge Function logs in Supabase dashboard
```

## 📝 VALIDATION RULES

### Translation Products
- ✅ Source language: Required
- ✅ Target language: Required
- ✅ Document type: At least 1 required
- ✅ File upload: At least 1 file, max 7MB

### Apostille/Attestation Products
- ✅ Document type: At least 1 required
- ✅ File upload: At least 1 file, max 7MB

### Startup Packages
- ✅ Package duration: Required (full/1-year/2-year)

### Checkout
- ✅ Email: Valid email format
- ✅ Phone: Valid phone number
- ✅ Address: All fields required
- ✅ City: Required
- ✅ State: Required
- ✅ Pincode: Required
- ✅ Country: Required

## 🎯 CODE LOCATIONS

### Key Files Reference

```
Authentication:
├─ Context: /src/app/context/AuthContext.tsx
├─ Sign In: /src/app/pages/SignInPage.tsx
├─ Sign Up: /src/app/pages/SignUpPage.tsx
└─ Utility: /src/app/utils/buildHeaders.ts

Cart Management:
├─ Context: /src/app/context/CartContext.tsx
├─ Cart Page: /src/app/pages/NewCartPage.tsx
└─ Add to Cart: ProductTemplate.tsx line 1164

Pricing Logic:
├─ Pricing Data: ProductTemplate.tsx lines 26-149
├─ Dynamic Price: ProductTemplate.tsx lines 358-429
└─ Price Display: ProductTemplate.tsx lines 702-721

Validation:
├─ Form Validation: ProductTemplate.tsx lines 1132-1159
└─ Checkout Validation: NewCheckoutAddressPage.tsx

Payment:
├─ Payment Page: /src/app/pages/NewPaymentPage.tsx
├─ Zoho Integration: /src/app/utils/zohoPaymentsIntegration.ts
└─ Backend: /supabase/functions/server/payment_gateways.tsx

Admin Panel:
├─ Layout: /src/app/components/admin/AdminLayout.tsx
├─ Dashboard: /src/app/pages/admin/AdminDashboard.tsx
└─ Orders: /src/app/pages/admin/OrdersPage.tsx

Product Data:
├─ Translations: /src/app/data/translationProductData.ts
├─ Attestations: /src/app/data/attestationProductData.ts
├─ Startups: /src/app/data/startupPackageData.ts
└─ Mapping: /src/app/data/directProductsMap.ts
```

## 🔐 CREDENTIALS

### Demo Accounts

**Admin Account**:
```
Email: admin@honeytranslations.com
Password: admin123
Access: Full admin panel access
```

**Test Customer Account**:
```
Email: customer@example.com
Password: customer123
Access: Customer portal access
```

### API Keys
- Supabase URL: Configured in `/src/utils/supabase/info.ts`
- Supabase Anon Key: Configured in environment variables
- Service Role Key: Server-side only (never exposed to frontend)

## 📊 ANALYTICS & MONITORING

### Key Metrics to Track
- Order conversion rate
- Cart abandonment rate
- Average order value
- Most popular services
- Customer lifetime value
- Page load times
- Error rates

### Monitoring Tools
- Supabase Dashboard (database queries, storage, auth)
- Browser DevTools (network, console, performance)
- React DevTools (component tree, state)

## 🚨 TROUBLESHOOTING

### Common Issues & Solutions

#### "Product Not Found" Error
```
Solution: Check product slug in URL matches entry in directProductsMap.ts
Example: /english-to-foreign-language (must match key in productData)
```

#### Price Shows as ₹2,000 (Not Updating)
```
Solution: 
1. Select both source AND target languages
2. Check if language pair exists in pricing constants
3. Verify getDynamicPrice() is being called
```

#### "Please complete the following" Error
```
Solution: Fill all required fields:
- Select source language
- Select target language
- Check at least one document type
- Upload at least one file
```

#### Cart Empty After Refresh
```
Solution: Check browser localStorage
- localStorage.getItem('honey_cart') should show cart data
- Clear browser cache if persisting
- Check for JavaScript errors in console
```

#### Admin Panel Not Accessible
```
Solution:
1. Ensure logged in with admin account
2. Check user role in AuthContext
3. Verify JWT token in localStorage
4. Try logging out and back in
```

#### File Upload Failing
```
Solution:
1. Check file size (must be < 7MB)
2. Verify storage bucket exists (documents-a67f0635)
3. Check bucket permissions in Supabase dashboard
4. Visit /storage-setup for diagnostics
```

## 🎓 LEARNING RESOURCES

### Understanding the Codebase
1. Start with `/src/app/App.tsx` to see route structure
2. Review `/src/app/context/` for state management
3. Explore `/src/app/components/product/ProductTemplate.tsx` for core logic
4. Check `/src/app/data/` for product configurations

### Key Concepts
- **Dynamic Pricing**: Price changes based on language selection
- **CartContext**: Global cart state with localStorage persistence
- **Validation**: Client-side form validation before cart addition
- **Protected Routes**: Admin routes require authentication
- **Edge Functions**: Backend API on Supabase (Deno/Hono)

## 📞 SUPPORT

### Getting Help
- Check `/COMPLETE_SYSTEM_GUIDE.md` for comprehensive documentation
- Review `/VERIFICATION_CHECKLIST.md` to test features
- Visit `/SYSTEM_ARCHITECTURE.md` for technical details
- Explore `/storage-setup` for storage diagnostics
- Use `/debug/database` for database testing

### Contact
- WhatsApp: +91 98426 96601
- Admin Email: admin@honeytranslations.com

---

**Quick Reference Version**: 1.0.0
**Last Updated**: March 5, 2026
**Status**: Complete ✅
