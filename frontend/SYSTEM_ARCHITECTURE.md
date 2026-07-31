# Honey Translation Services - System Architecture

## 🏗️ ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Public     │  │   Customer   │  │    Admin     │          │
│  │   Pages      │  │   Portal     │  │    Panel     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                  │                  │                  │
│         └──────────────────┴──────────────────┘                  │
│                            │                                     │
│                    ┌───────▼───────┐                            │
│                    │   Contexts    │                            │
│                    │  (State Mgmt) │                            │
│                    └───────┬───────┘                            │
│                            │                                     │
└────────────────────────────┼─────────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Supabase Edge  │
                    │   Functions     │
                    │  (Hono Server)  │
                    └────────┬────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
    ┌───────▼───────┐ ┌─────▼─────┐ ┌───────▼───────┐
    │   Supabase    │ │  Storage  │ │  Razorpay     │
    │   Database    │ │  Buckets  │ │   Gateway     │
    └───────────────┘ └───────────┘ └───────────────┘
```

## 📦 COMPONENT ARCHITECTURE

### Frontend Structure

```
src/app/
│
├── App.tsx (Root Component)
│   ├── BrowserRouter (v7 with future flags)
│   ├── ErrorBoundary
│   ├── ScrollToTop
│   ├── DatabaseSetup
│   ├── DemoUserInitializer
│   │
│   └── Context Providers (Nested)
│       ├── AuthProvider
│       │   └── CurrencyProvider
│       │       └── CartProvider
│       │           └── WishlistProvider
│       │               └── ProductProvider
│       │                   └── Routes
│
├── components/
│   ├── admin/
│   │   ├── AdminLayout.tsx (Sidebar navigation)
│   │   ├── EnhancedOrderRow.tsx
│   │   ├── OrderManagementVisual.tsx
│   │   └── OrderTrackingManager.tsx
│   │
│   ├── home/ (17 Homepage Sections)
│   │   ├── HeroSection.tsx
│   │   ├── PickYourLanguage.tsx
│   │   ├── PickYourApostille.tsx
│   │   ├── OurServices.tsx
│   │   ├── SwornTranslation.tsx
│   │   ├── ChooseSwornTranslation.tsx
│   │   ├── BrandMessage.tsx
│   │   ├── ApostilleServices.tsx
│   │   ├── CompanyLogosSlider.tsx
│   │   ├── ProfessionalAgencySection.tsx
│   │   ├── ISOCertificationSection.tsx
│   │   ├── WhyChooseUs.tsx
│   │   ├── TranslatorExperience.tsx
│   │   ├── CustomerReviews.tsx
│   │   ├── GoogleReviewsSection.tsx
│   │   ├── ReviewsSlider.tsx
│   │   ├── Testimonials.tsx
│   │   └── StartupPackages.tsx
│   │
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── HeaderNew.tsx
│   │   ├── Footer.tsx
│   │   ├── FooterNew.tsx
│   │   ├── PublicLayout.tsx
│   │   ├── AdminAccessButton.tsx
│   │   └── WhatsAppButton.tsx
│   │
│   ├── product/
│   │   ├── ProductTemplate.tsx (Main product page component)
│   │   │   ├── Dynamic Pricing Logic
│   │   │   ├── Form Validation
│   │   │   ├── File Upload Handling
│   │   │   ├── Image Gallery with Zoom
│   │   │   ├── Add to Cart Logic
│   │   │   └── Related Products
│   │   └── ProductReviews.tsx
│   │
│   ├── ui/ (Shadcn Components - 40+ components)
│   │   ├── accordion.tsx
│   │   ├── alert-dialog.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   └── ... (30+ more)
│   │
│   ├── ProductPopup.tsx (Quick view modal)
│   ├── ProtectedRoute.tsx (Auth guard)
│   ├── ErrorBoundary.tsx (Error handling)
│   ├── ScrollToTop.tsx (Route change scroll)
│   ├── DatabaseSetup.tsx (DB initialization)
│   ├── DemoUserInitializer.tsx (Demo auth)
│   ├── ZohoPayNowButton.tsx (Payment button)
│   ├── CustomerNotificationBell.tsx
│   ├── LiveOrderTracking.tsx
│   └── EdgeFunctionDiagnostics.tsx
│
├── context/ (Global State Management)
│   ├── AuthContext.tsx
│   │   ├── Login/Logout functions
│   │   ├── User state
│   │   ├── Session management
│   │   └── Role-based access
│   │
│   ├── CartContext.tsx
│   │   ├── Cart items array
│   │   ├── Add/remove/update functions
│   │   ├── Coupon management
│   │   ├── Price calculations
│   │   └── LocalStorage persistence
│   │
│   ├── CurrencyContext.tsx
│   │   ├── Currency selection (INR/USD)
│   │   ├── Conversion rates
│   │   └── Price formatting
│   │
│   ├── ProductContext.tsx
│   │   ├── Product state
│   │   ├── Quick view modal
│   │   └── Product operations
│   │
│   └── WishlistContext.tsx
│       ├── Wishlist items
│       ├── Add/remove functions
│       └── LocalStorage persistence
│
├── data/ (Static Data & Configuration)
│   ├── translationProductData.ts
│   │   ├── English to Foreign Language
│   │   ├── Foreign Language to English
│   │   ├── English to Indian Language
│   │   └── Indian Language to English
│   │
│   ├── attestationProductData.ts
│   │   ├── UAE Attestation
│   │   ├── China Attestation
│   │   ├── Qatar Attestation
│   │   ├── Kuwait Attestation
│   │   └── HRD Attestation (TN)
│   │
│   ├── startupPackageData.ts
│   │   ├── Basic Package
│   │   ├── Standard Package
│   │   └── Premium Package
│   │
│   ├── directProductsMap.ts (URL to Product mapping)
│   ├── allProductData.ts (Combined products)
│   └── startupProductsList.ts
│
├── pages/ (50+ Page Components)
│   ├── HomePage.tsx
│   ├── DirectProductPage.tsx (Dynamic product pages)
│   │
│   ├── Cart & Checkout Flow:
│   ├── NewCartPage.tsx
│   ├── NewCheckoutAddressPage.tsx
│   ├── NewCheckoutReviewPage.tsx
│   ├── NewPaymentPage.tsx
│   ├── OrderSuccessPage.tsx
│   │
│   ├── Customer Pages:
│   ├── MyOrdersPage.tsx
│   ├── MyProfilePage.tsx
│   ├── MyAddressPage.tsx
│   ├── TrackOrderPage.tsx
│   ├── LiveOrderTrackingPage.tsx
│   │
│   ├── Auth Pages:
│   ├── SignInPage.tsx
│   ├── SignUpPage.tsx
│   │
│   ├── Listing Pages:
│   ├── AllTranslationProductsPage.tsx
│   ├── AllApostilleProductsPage.tsx
│   ├── AllAttestationProductsPage.tsx
│   ├── AllStartupProductsPage.tsx
│   ├── AllLanguageProductsPage.tsx
│   ├── SwornTranslationsListingPage.tsx
│   │
│   ├── Info Pages:
│   ├── ContactPage.tsx
│   ├── ContactUsPage.tsx
│   ├── FAQPage.tsx
│   ├── BlogPage.tsx
│   ├── PrivacyPolicyPage.tsx
│   ├── TermsAndConditionsPage.tsx
│   ├── RefundCancellationPolicyPage.tsx
│   ├── TermsOfServicePage.tsx
│   ├── PricingPlanPage.tsx
│   ├── ContentPage.tsx
│   ├── WorkSamplePage.tsx
│   │
│   ├── Debug/Setup Pages:
│   ├── StorageSetup.tsx
│   ├── DatabaseDiagnosticsPage.tsx
│   ├── EdgeFunctionHelpPage.tsx
│   ├── CustomersDebugPage.tsx
│   ├── InitDemo.tsx
│   │
│   └── admin/ (20+ Admin Pages)
│       ├── AdminDashboard.tsx
│       ├── OrdersPage.tsx
│       ├── OrderDetailPage.tsx
│       ├── CustomersPage.tsx
│       ├── CustomerEmailsPage.tsx
│       ├── CustomerQueriesPage.tsx
│       ├── ItemsPage.tsx
│       ├── AddEditItemPage.tsx
│       ├── ProductFieldsConfigPage.tsx
│       ├── CategoriesPage.tsx
│       ├── CouponsPage.tsx
│       ├── SalesPage.tsx
│       ├── NotificationsPage.tsx
│       ├── ReportsPage.tsx
│       ├── WorkSamplesPage.tsx
│       ├── APIKeysPage.tsx
│       ├── PaymentSettingsPage.tsx
│       ├── PaymentTransactionsPage.tsx
│       └── ... (more admin pages)
│
├── services/ (Business Logic)
│   ├── couponService.ts
│   │   ├── validateCoupon()
│   │   ├── applyCoupon()
│   │   ├── calculateDiscount()
│   │   └── getActiveCoupons()
│   │
│   └── storageService.ts
│       ├── uploadFile()
│       ├── deleteFile()
│       ├── getSignedUrl()
│       └── listFiles()
│
├── hooks/ (Custom React Hooks)
│   └── useProductConfig.ts
│       ├── Product field configuration
│       └── Dynamic field rendering
│
└── utils/ (Utility Functions)
    ├── buildHeaders.ts (JWT auth utility)
    ├── supabaseClient.ts (Supabase setup)
    ├── supabaseStorage.ts (Storage operations)
    ├── zohoPaymentsIntegration.ts (Payment gateway)
    ├── paymentGateways.ts (Gateway selection)
    ├── getActivePaymentGateway.ts
    └── clearStorage.ts (Cache management)
```

## 🔄 DATA FLOW ARCHITECTURE

### 1. Product Viewing Flow

```
User visits product page
        │
        ▼
DirectProductPage.tsx
        │
        ├─ Extract slug from URL
        ├─ Get product from directProductsMap
        │
        ▼
ProductTemplate.tsx
        │
        ├─ Load product data
        ├─ Fetch images from database
        ├─ Initialize form state
        │
        ▼
Render Product UI
        │
        ├─ Image gallery with zoom
        ├─ Dynamic pricing display
        ├─ Configuration form
        │   ├─ Source language dropdown
        │   ├─ Target language dropdown
        │   ├─ Document type checkboxes
        │   └─ File upload area
        │
        └─ Add to Cart button
```

### 2. Dynamic Pricing Flow

```
User selects language pair
        │
        ▼
sourceLanguage/targetLanguage state updates
        │
        ▼
getDynamicPrice() function triggered
        │
        ├─ Check product type (translation/apostille/attestation/startup)
        │
        ├─ For TRANSLATION:
        │   ├─ Check if sworn translation (title contains "sworn")
        │   │   ├─ Yes: Use SWORN_TRANSLATION_PRICING
        │   │   └─ No: Use language-specific pricing
        │   │       ├─ Indian → English: INDIAN_TO_ENGLISH
        │   │       ├─ English → Indian: ENGLISH_TO_INDIAN
        │   │       ├─ Foreign → English: FOREIGN_TO_ENGLISH
        │   │       └─ English → Foreign: ENGLISH_TO_FOREIGN
        │   │
        │   └─ Return offer price (e.g., ₹600-₹1,800)
        │
        ├─ For APOSTILLE:
        │   └─ Return APOSTILLE_OFFER (₹2,500)
        │
        ├─ For ATTESTATION:
        │   ├─ Extract country from title
        │   └─ Return country-specific offer price
        │
        └─ For STARTUP:
            ├─ Extract package type (basic/standard/premium)
            ├─ Check selected duration (full/1-year/2-year)
            └─ Return package-specific offer price
        │
        ▼
getDynamicOriginalPrice() function triggered
        │
        ├─ For TRANSLATION: Return ₹2,000 (or ₹5,000 for sworn)
        ├─ For APOSTILLE: Return ₹3,500
        ├─ For ATTESTATION: Return country-specific original
        └─ For STARTUP: Return package-specific original
        │
        ▼
Update UI with new prices
        │
        ├─ currentPrice (offer) → Red bold text
        ├─ currentOriginalPrice → Gray strikethrough
        └─ Dynamic pricing message (for translations)
```

### 3. Add to Cart Flow

```
User clicks "Add to Cart"
        │
        ▼
Validation Check (lines 1132-1159)
        │
        ├─ For TRANSLATION products:
        │   ├─ ✓ Source language selected?
        │   ├─ ✓ Target language selected?
        │   ├─ ✓ Document type selected?
        │   └─ ✓ File uploaded?
        │
        ├─ For APOSTILLE/ATTESTATION:
        │   ├─ ✓ Document type selected?
        │   └─ ✓ File uploaded?
        │
        └─ For STARTUP:
            └─ ✓ Package duration selected?
        │
        ▼
Validation Failed?
        │
        ├─ YES → Show error toast with list of missing fields
        └─ NO  → Continue
                  │
                  ▼
        Create CartItem object
                  │
                  ├─ Generate unique ID
                  ├─ Set name (product title)
                  ├─ Set basePrice (currentPrice)
                  ├─ Set category (product type)
                  ├─ Set url (current page)
                  ├─ Set image (first product image)
                  ├─ Set sourceLanguage
                  ├─ Set targetLanguage
                  ├─ Set certificateType (joined doc types)
                  ├─ Set uploadedDocument (first file)
                  ├─ Set pageCount (default: 1)
                  └─ Set totalPrice (basePrice × pageCount)
                  │
                  ▼
        CartContext.addToCart()
                  │
                  ├─ Check if item exists (by ID)
                  │   ├─ Exists: Update existing item
                  │   └─ New: Add to cart array
                  │
                  ├─ Update localStorage
                  │
                  └─ Trigger re-render
                  │
                  ▼
        Show success toast
                  │
                  ▼
        Navigate to /cart (line 1180)
                  │
                  ▼
        NewCartPage.tsx displays cart
                  │
                  ├─ Show all cart items
                  ├─ Display item details
                  ├─ Allow quantity adjustment
                  ├─ Show coupon input
                  ├─ Calculate totals
                  └─ "Proceed to Checkout" button
```

### 4. Checkout Flow

```
User clicks "Proceed to Checkout"
        │
        ▼
/checkout/address (NewCheckoutAddressPage)
        │
        ├─ Shipping address form
        ├─ Billing address form
        └─ "Continue to Review" button
        │
        ▼
/checkout/review (NewCheckoutReviewPage)
        │
        ├─ Order summary
        ├─ Applied coupon display
        ├─ Address confirmation
        ├─ Price breakdown
        └─ "Proceed to Payment" button
        │
        ▼
/checkout/payment (NewPaymentPage)
        │
        ├─ Payment method selection
        ├─ Zoho Payments integration
        └─ "Complete Payment" button
        │
        ▼
Zoho Payments Gateway
        │
        ├─ Process payment
        ├─ Verify transaction
        └─ Return status
        │
        ▼
/order-success (OrderSuccessPage)
        │
        ├─ Order confirmation message
        ├─ Order number display
        ├─ Order tracking link
        └─ Email notification sent
```

### 5. Admin Order Management Flow

```
Admin logs in → /admin/orders
        │
        ▼
OrdersPage.tsx
        │
        ├─ Fetch orders from database
        ├─ Display orders table
        │   ├─ Order ID
        │   ├─ Customer name
        │   ├─ Status
        │   ├─ Total amount
        │   └─ Date
        │
        └─ Click order → /admin/orders/:orderId
                            │
                            ▼
                OrderDetailPage.tsx
                            │
                            ├─ Order details display
                            ├─ Customer information
                            ├─ Items ordered
                            ├─ Payment status
                            ├─ Tracking information
                            │
                            └─ Update order status
                                        │
                                        ├─ Change status dropdown
                                        ├─ Add tracking number
                                        ├─ Add notes
                                        └─ Save changes
                                                    │
                                                    ▼
                                        Supabase Backend
                                                    │
                                                    ├─ Update order in database
                                                    ├─ Send notification to customer
                                                    └─ Update admin dashboard stats
```

## 🗄️ DATABASE ARCHITECTURE

### Supabase Tables (Key-Value Store)

```
kv_store_a67f0635 (Main Table)
├─ key: string (primary key)
├─ value: jsonb (flexible data storage)
└─ created_at: timestamp

Data Stored:
├─ orders:{orderId} → Order data
├─ customers:{customerId} → Customer data
├─ products:{productId} → Product data
├─ coupons:{couponCode} → Coupon data
├─ settings:{settingKey} → App settings
└─ tracking:{orderId} → Order tracking info
```

### Storage Buckets

```
documents-a67f0635 (Private)
├─ Uploaded documents from customers
├─ Access: Private with signed URLs
└─ Max size: 7MB per file

work-samples-a67f0635 (Public)
├─ Portfolio/sample work files
├─ Access: Public read
└─ Admin upload only
```

## 🔐 AUTHENTICATION FLOW

```
User visits /signin
        │
        ▼
SignInPage.tsx
        │
        ├─ Email input
        ├─ Password input
        └─ "Sign In" button
        │
        ▼
Supabase Auth
        │
        ├─ Verify credentials
        ├─ Generate JWT token
        └─ Create session
        │
        ▼
AuthContext updates
        │
        ├─ Set user state
        ├─ Store token in localStorage
        └─ Set isAuthenticated = true
        │
        ▼
Check user role
        │
        ├─ Admin → Redirect to /admin
        └─ Customer → Redirect to previous page or /
```

## 🎨 STYLING ARCHITECTURE

```
Tailwind CSS v4
├─ /src/styles/theme.css (Design tokens)
│   ├─ Colors
│   ├─ Typography
│   ├─ Spacing
│   └─ Breakpoints
│
├─ /src/styles/tailwind.css (Tailwind imports)
├─ /src/styles/fonts.css (Font imports)
└─ /src/styles/index.css (Global styles)

Shadcn UI Components
└─ /src/app/components/ui/
    └─ Pre-styled, accessible components
```

## 🚀 DEPLOYMENT ARCHITECTURE

```
Production Environment
│
├─ Frontend (Vercel/Netlify)
│   ├─ React SPA
│   ├─ Vite build
│   └─ Static assets
│
├─ Backend (Supabase)
│   ├─ Edge Functions (Deno)
│   │   └─ Hono server at /make-server-a67f0635
│   │
│   ├─ PostgreSQL Database
│   │   └─ kv_store_a67f0635 table
│   │
│   ├─ Storage Buckets
│   │   ├─ documents-a67f0635
│   │   └─ work-samples-a67f0635
│   │
│   └─ Authentication
│       └─ JWT-based auth
│
└─ Payment Gateway (Zoho)
    └─ Secure payment processing
```

## 📊 PERFORMANCE CONSIDERATIONS

### Optimization Strategies

1. **Code Splitting**: React.lazy() for route-based splitting
2. **Image Optimization**: Lazy loading, responsive images
3. **State Management**: Context API with selective re-renders
4. **Caching**: LocalStorage for cart and wishlist
5. **Bundle Size**: Tree-shaking unused code
6. **API Calls**: Debounced form inputs, request batching

### Monitoring Points

- Page load time
- Time to interactive
- Bundle size
- API response times
- Database query performance
- Storage bucket access speed

## 🔒 SECURITY ARCHITECTURE

### Frontend Security
- Input sanitization
- XSS prevention
- CSRF protection
- Secure localStorage usage
- Environment variables for secrets

### Backend Security
- JWT authentication
- Row Level Security (RLS) policies
- CORS configuration
- Rate limiting
- File upload validation
- SQL injection prevention

### Payment Security
- PCI DSS compliance
- Secure payment gateway (Zoho)
- No sensitive data storage
- Encrypted transactions

## 🎯 SCALABILITY CONSIDERATIONS

### Current Capacity
- Supports thousands of concurrent users
- Unlimited products/services
- Unlimited orders
- Auto-scaling with Supabase

### Future Scaling Options
- CDN for static assets
- Redis caching layer
- Microservices architecture
- Load balancing
- Database sharding
- Queue system for async tasks

---

**Last Updated**: March 5, 2026
**Version**: 1.0.0
**Status**: Production Ready ✅
