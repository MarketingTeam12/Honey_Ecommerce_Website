# Product URL Guide for Honey Translation Services

This document lists all available product pages and their URLs.

## ✅ Translation Services (4 SEPARATE PAGES)

### 1. English to Foreign Language
- **URL**: `/english-to-foreign-language`
- **Price**: ₹900 – ₹2,000
- **Default Languages**: English → Dutch
- **Available Target Languages**: Dutch, Spanish, French, German, Italian, Portuguese, Russian, Chinese, Japanese, Korean, Arabic

### 2. Foreign Language to English
- **URL**: `/foreign-language-to-english`
- **Price**: ₹900
- **Default Languages**: Dutch → English
- **Available Source Languages**: Dutch, Spanish, French, German, Italian, Portuguese, Russian, Chinese, Japanese, Korean, Arabic

### 3. Any Indian Language to English
- **URL**: `/any-indian-language-to-english`
- **Price**: ₹400 – ₹1,500
- **Default Languages**: Assamese → English
- **Available Source Languages**: Assamese, Bengali, Gujarati, Hindi, Kannada, Malayalam, Marathi, Odia, Punjabi, Tamil, Telugu, Urdu

### 4. English to Any Indian Language
- **URL**: `/english-to-any-indian-language`
- **Price**: ₹400 – ₹1,000
- **Default Languages**: English → Assamese
- **Available Target Languages**: Assamese, Bengali, Gujarati, Hindi, Kannada, Malayalam, Marathi, Odia, Punjabi, Tamil, Telugu, Urdu

---

## ✅ Attestation Services (5 SEPARATE PAGES)

### 1. UAE Attestation
- **URL**: `/uae-attestation`
- **Price**: ₹9,500 – ₹10,000

### 2. China Attestation
- **URL**: `/china-attestation`
- **Price**: ₹16,000 – ₹17,000

### 3. Qatar Attestation
- **URL**: `/qatar-attestation`
- **Price**: ₹9,500 – ₹10,000

### 4. Kuwait Attestation
- **URL**: `/kuwait-attestation`
- **Price**: ₹16,000 – ₹17,000

### 5. HRD Attestation (TN)
- **URL**: `/hrd-attestation-tn`
- **Price**: ₹2,500 – ₹3,000

---

## ✅ Startup Packages (3 SEPARATE PAGES)

### 1. Basic Startup Package
- **URL**: `/basic-startup-package`
- **Price**: ₹17,999 – ₹25,999

### 2. Standard Startup Package
- **URL**: `/standard-startup-package`
- **Price**: ₹18,999 – ₹36,999

### 3. Premium Startup Package
- **URL**: `/premium-startup-package`
- **Price**: ₹38,999 – ₹73,999

---

## Product Template Features

Each product page includes:

✅ **2-Column Desktop Layout**
- Left: Product images with Amazon-style zoom
- Right: Product details, pricing, configuration options

✅ **Image Gallery**
- 4 high-quality images per product
- Thumbnail navigation
- Hover zoom with cursor tracking
- Mobile-friendly slider

✅ **Product Details Panel**
- Product title
- Non-returnable badge
- Discounted price with "BEST OFFER" badge
- Product highlights (checkmarks)
- WhatsApp quick support link
- Secure checkout payment icons

✅ **Configurable Options**
- Source & Target Language dropdowns (Translation only)
- Document type checkboxes
- File upload (max 7MB, multiple files)
- Page counter with +/- buttons
- Sticky "Add to Cart" button

✅ **Information Tabs**
1. Product Details
2. What You'll Receive
3. How the Process Works (5 steps)
4. Delivery Timeline
5. Why Choose Honey Translations

✅ **Additional Sections**
- Ratings & Reviews (0.0 / 5 - Only Verified Buyers)
- More Like This (3 related products)

✅ **Mobile Responsive**
- Image slider with navigation
- Sticky Add to Cart at bottom
- Collapsible sections
- Touch-friendly zoom

---

## Currency Conversion

All prices automatically convert based on selected currency:
- 🇮🇳 INR (₹)
- 🇺🇸 USD ($)
- 🇪🇺 EUR (€)
- 🇬🇧 GBP (£)
- 🇦🇪 AED (د.إ)

---

## Implementation Architecture

### Data Files
- `/src/app/data/translationProductData.ts` - Translation products data
- `/src/app/data/attestationProductData.ts` - Attestation products data
- `/src/app/data/startupPackageData.ts` - Startup packages data
- `/src/app/data/directProductsMap.ts` - Combined mapping

### Page Component
- `/src/app/pages/DirectProductPage.tsx` - Unified product page component

### Template Component
- `/src/app/components/product/ProductTemplate.tsx` - Reusable product template

### Routing
All routes defined in `/src/app/App.tsx`:
- Direct URL routes (e.g., `/english-to-foreign-language`)
- No dynamic segments for these products
- Clean, SEO-friendly URLs

---

## Key Features

✅ **One Common Product Template** - All products use the same ProductTemplate component  
✅ **Only Content Changes** - Title, price, default languages, and product details vary  
✅ **Same UI/Layout** - Upload, page count, tabs, reviews, related products remain consistent  
✅ **Direct URLs** - Each product has its own direct URL (no `/product/:id` pattern)  
✅ **Default Language Values** - Dropdown menus automatically show default selections  
✅ **Currency Conversion** - Prices update based on selected currency  
✅ **Mobile Responsive** - Fully responsive design for all devices  
✅ **Amazon-style Zoom** - Image zoom effect on hover  
✅ **Related Products** - Each page shows 3 related products  

---

## Navigation Menu Links

The header navigation dropdown menus link to:

**Language Dropdown:**
- English to Foreign Language → `/english-to-foreign-language`
- Foreign Language to English → `/foreign-language-to-english`
- Any Indian Language to English → `/any-indian-language-to-english`
- English to Any Indian Language → `/english-to-any-indian-language`

**Attestation Dropdown:**
- UAE Attestation → `/uae-attestation`
- China Attestation → `/china-attestation`
- Qatar Attestation → `/qatar-attestation`
- Kuwait Attestation → `/kuwait-attestation`
- HRD Attestation (TN) → `/hrd-attestation-tn`

**Startup Dropdown:**
- Basic Startup Package → `/basic-startup-package`
- Standard Startup Package → `/standard-startup-package`
- Premium Startup Package → `/premium-startup-package`

---


---

## Status: ✅ COMPLETE

All 12 product pages have been successfully created and integrated:
- ✅ 4 Translation product pages
- ✅ 5 Attestation service pages
- ✅ 3 Startup package pages

All pages use the same ProductTemplate component with only content and configuration differences as specified.
