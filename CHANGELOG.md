# Changelog – Honey Universal Services Website Audit (`honeyuniversal.com`)

**Prepared by:** Mano Rakshahan

---

## 2026-11-12 (Batches 4 – 8 Phase 1)

### Performance, Cookie Consent & Monitoring (Batch 8 – Phase 1)
- **Route code splitting (`14.04`):** Kept `HomePage` eager in the main bundle and converted all 30 admin pages to `React.lazy`, plus added `manualChunks` (`vendor-react`, `vendor-motion`, `vendor-radix`) in `frontend/vite.config.ts`. Reduced main entry chunk from `1,696.13 kB` (`472.61 kB` gzip) to `524.37 kB` (`148.30 kB` gzip).
- **Cache headers (`14.08`):** Added `/assets/*` (`public, max-age=31536000, immutable`) and `/index.html` (`no-cache, no-store, must-revalidate`) rules in `frontend/public/_headers`.
- **Cookie notice & widget gating (`16.04`):** Added `CookieConsentContext`, `CookieConsentBanner`, footer `"Cookie settings"` link, and consent gating for Zoho SalesIQ, Trustindex reviews, and embedded YouTube videos (`ConsentYouTubeEmbed`).
- **Mobile drawer & responsive checks (`18.06`):** Verified mobile menu (`absolute left-0 right-0 top-full`) opens/closes with zero header shift across `360px`, `390px`, and `412px` viewports in headless Chrome.
- **Error tracking & integration logging (`20.02`, `19.08`):** Added `errorTracking.ts` (`window.onerror`, `unhandledrejection`, `captureError`, optional `VITE_SENTRY_DSN` forwarding) wired into `main.tsx` and `ErrorBoundary.tsx`.

### Customer Account, Contact, Newsletter & Security (Batch 7)
- **Signed owner-only order downloads (`9.02`):** Locked down `GET /api/orders/:id/download-completed-file` to `requireAuth` + owner/admin check (`403` for non-owners) returning 5-minute presigned S3 URLs; gated `PATCH /api/orders/:id/completed-file` with `requireAdmin`.
- **Profile, password & deletion requests (`9.03`, `9.05`):** Added `POST /api/auth/change-password`, `+91` 10-digit Indian mobile validation, Batch 4 password rules + `<PasswordRulesChecklist />` on `MyProfilePage`, and `"Request Account Deletion"` (`POST /api/auth/request-deletion` -> `account_deletion_requests` table + admin notification/email).
- **Contact, newsletter & privacy consent (`12.01`, `12.03`, `12.06`, `16.06`):** Added country/`+91`/email/message validation, honeypot (`website`), client cooldowns, server `publicFormLimiter` (`15` reqs / `15 min`), HTML-escaped notification emails, duplicate newsletter detection, signed `GET /api/unsubscribe-email`, and required Privacy Policy consent checkboxes on both `/contact` and `/contact-us`.
- **Auth & security checks (`8.02`, `8.04`, `15.10`, `15.12`, `15.13`):** Confirmed generic `401` login error (`"Invalid email or password"`), `authLimiter` (`20` reqs / `15 min`), zero private keys bundled in `frontend/dist`, and `<Navigate to="/signin" replace />` on `MyProfilePage` when signed out.

### Document Uploads, Private S3 & Razorpay Checkout (Batch 6)
- **Upload validation & multi-file UX (`7.01`–`7.03`, `7.08`):** Client & server enforcement of `PDF`, `DOC`, `DOCX`, `JPG`, `PNG` and `50 MB` per-file limit, native `<progress>`, per-file remove, duplicate handling, and `https://` cloud link provider validation.
- **Private S3 storage (`7.05`):** Enforced `AES256` SSE, private `CacheControl`, `/api/s3/signed-url` routing, and `requireAuth` + object prefix checks (`authorizeObjectAccess`).
- **Cart, Razorpay INR & webhooks (`6.02`–`6.06`, `6.09`, `6.10`, `19.01`, `19.02`):** Added unit price/qty/stepper to cart, linked `/refund-cancellation-policy`, enforced `INR` paise in Razorpay, added idempotent `/payment/create-order`, HMAC-SHA256 `/payment/verify` & `/payment/webhook`, and failure/cancel retry preserving cart.

### SEO Schema, Skeletons, Contrast & Accessibility (Batch 5)
- **JSON-LD (`13.07`):** Added factual `Organization`, `LocalBusiness`, `FAQPage`, `BlogPosting`, and `BreadcrumbList` schemas.
- **Skeletons, typography & WCAG (`1.01`, `1.06`, `17.01`, `17.02`, `17.07`, `17.08`):** Added route/list skeletons, standardized font/color tokens, fixed WCAG 2.1 AA contrast & `:focus-visible` outlines, enlarged mobile touch targets (`>= 44x44px`), and added carousel Pause/Play + `prefers-reduced-motion` support.

### Auth UX, Order Retention & Floating Widgets (Batch 4)
- **Password reset & policy (`8.03`, `8.05`, `8.08`):** Added forgot/reset password flow (`password_reset_tokens`), 8-char letter+number policy, and required Terms & Privacy consent on sign-up (`users.terms_accepted_at`).
- **Order retention, brand buttons & spacing (`6.01`, `1.02`, `1.10`, `4.07`):** Preserved product configuration across sign-in redirect, applied navy `#1a1f5c` brand buttons, stacked floating widgets without overlap, and added bounded `1..500` `PageCountStepper`.

---

## 2026-11-11 (Batches 1 – 3)
- **Navigation, product routing & 404 (`2.02`, `2.06`, `4.02`, `4.03`, `4.05`, `4.11`, `8.07`, `1.08`, `11.06`, `17.04`, `17.05`):** Fixed `/about` footer link, added `NotFoundPage`, fixed apostille slug matching, hid empty gallery controls, implemented largest-remainder rating percentages (`100%`), defaulted sign-up phone to `+91`, added friendly `/work-sample` fallback, fixed FAQ spacing, and added `aria-label`s.
- **SEO meta, `robots.txt` & `sitemap.xml` (`13.01`–`13.06`, `11.08`):** Added per-route titles, descriptions, OG/Twitter tags, canonical URLs, `robots.txt`, and `sitemap.xml`.
- **Security headers (`15.03`–`15.05`, `15.08`):** Configured HSTS, CSP Report-Only, `X-Frame-Options`, and CORS cleanup in `public/_headers`.
