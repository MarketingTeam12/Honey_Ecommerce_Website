# Deployment Checklist – Honey Universal Services (`honeyuniversal.com`)

**Prepared by:** Mano Rakshahan  
**Important:** Never commit real secret values to Git. Set secrets only in your hosting/environment dashboards or server `.env` files.

---

## 1. Deployment Order (Follow Strictly)
1. **Back up the production MySQL database** before any schema or code changes:
   ```bash
   mysqldump -h <MYSQL_HOST> -P <MYSQL_PORT> -u <MYSQL_USER> -p --single-transaction --routines --triggers <MYSQL_DATABASE> > backup_$(date +%F_%H%M).sql
   ```
2. **Record rollback baselines:**
   - Backend: `git rev-parse HEAD` (or record the current release tag / archive timestamp).
   - Frontend: Note the current active **Cloudflare Pages Deployment ID** in Cloudflare Pages → **Deployments**.
3. **Run the additive database changes** (auto-runs on backend startup via `initializeDatabase()` in `backend/config/database.js`, or run manually first in MySQL):
   ```sql
   -- 1) Terms consent timestamp on users (Batch 4)
   ALTER TABLE users
     ADD COLUMN IF NOT EXISTS terms_accepted_at DATETIME NULL AFTER last_login_at;

   -- 2) Password reset tokens (Batch 4)
   CREATE TABLE IF NOT EXISTS password_reset_tokens (
     id VARCHAR(64) PRIMARY KEY,


     
     user_id VARCHAR(64) NOT NULL,
     token_hash VARCHAR(64) NOT NULL UNIQUE,
     expires_at DATETIME NOT NULL,
     used_at DATETIME NULL,
     created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
     INDEX idx_password_reset_user (user_id),
     INDEX idx_password_reset_expires (expires_at)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

   -- 3) Account deletion requests (Batch 7)
   CREATE TABLE IF NOT EXISTS account_deletion_requests (
     id VARCHAR(64) PRIMARY KEY,
     user_id VARCHAR(64) NOT NULL,
     email VARCHAR(255) NOT NULL,
     name VARCHAR(255) NULL,
     reason TEXT NULL,
     status VARCHAR(32) NOT NULL DEFAULT 'pending',
     requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
     processed_at DATETIME NULL,
     INDEX idx_deletion_user (user_id),
     INDEX idx_deletion_status (status)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
   ```
4. **Deploy the backend** (`npm --prefix backend install --omit=dev` + restart server) and immediately verify `GET https://<api-domain>/api/health` returns `200`.
5. **Deploy the frontend** (`npm --prefix frontend run build` → Cloudflare Pages `dist/`).

---

## 2. Environment Variables (Names & Where to Set)

### Frontend (Cloudflare Pages → Settings → Environment variables)
| Variable | Purpose | Notes |
|---|---|---|
| `VITE_API_BASE_URL` | Backend API base URL (e.g. `https://api.honeyuniversal.com`) | Required in Production & Preview |
| `VITE_RAZORPAY_KEY_ID` | Public Razorpay Key ID (`rzp_test_...` for Preview/Staging, `rzp_live_...` for Production) | Public key only — **never** put `RAZORPAY_KEY_SECRET` in `VITE_*` |
| `VITE_SENTRY_DSN` | Optional Sentry DSN for `errorTracking.ts` | Leave empty until Sentry project is created |
| `VITE_TURNSTILE_SITE_KEY` | Optional Cloudflare Turnstile site key | Only needed if adding Turnstile on top of honeypot + rate limits |

### Backend (`backend/.env` on Node/API host — see `backend/.env.example`)
| Variable | Purpose | Notes |
|---|---|---|
| `PORT` | Backend HTTP port (e.g. `3000`) | Server listen port |
| `NODE_ENV` | `production` | Controls production behavior |
| `FRONTEND_URL` | Comma-separated allowed frontend origins | Include `https://honeyuniversal.com,https://www.honeyuniversal.com` and your Cloudflare Pages preview URL (e.g. `https://<branch>.<project>.pages.dev`) |
| `BACKEND_PUBLIC_URL` | Public API URL (e.g. `https://api.honeyuniversal.com`) | Used to build `/api/unsubscribe-email` links in newsletter emails |
| `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE` | Hostinger MySQL connection | Keep strong credentials |
| `JWT_SECRET` | Signs customer/admin JWT session tokens | Long random string; **never** reuse defaults |
| `SESSION_SECRET` | Express/OAuth session signing secret | Long random string |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` | Google OAuth 2.0 login | Standardized callback path: **`/api/auth/google/callback`** (`https://<api-domain>/api/auth/google/callback` in prod, `http://localhost:3000/api/auth/google/callback` locally) |
| `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET_NAME` | Private AWS S3 document upload & signed URLs | IAM user should have minimal S3 permissions for that bucket only |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Razorpay order creation & payment HMAC verification | Use `rzp_test_...` in preview/staging; switch to `rzp_live_...` only in production |
| `RAZORPAY_WEBHOOK_SECRET` | Verifies `X-Razorpay-Signature` on `/api/payment/webhook` | **Differs between Test Mode and Live Mode** — set the Test webhook secret in staging and the Live webhook secret in production |
| `RESEND_API_KEY` | Resend transactional email API key | Used for password reset, order confirmation, deletion requests, contact & newsletter |
| `RESEND_FROM_EMAIL` | Verified sender address in Resend (e.g. `Honey Translations <noreply@honeyuniversal.com>`) | Domain must be verified in Resend DNS |
| `ADMIN_EMAIL` | **Required** destination for account deletion requests (`/api/auth/request-deletion`) | No fallback to the `noreply` sender (`RESEND_FROM_EMAIL`); deletion emails are skipped with a warning if unset |
| `ADMIN_NOTIFICATION_EMAIL` | Destination inbox for contact form (`/api/customer-queries`) alerts | Set to a test address in staging; official inbox in production |

---

## 3. Cloudflare Pages (`_headers`, CSP & Reverse Proxy)
- **Deploy `frontend/public/_headers`:**
  - `/*` sets `Cache-Control: no-cache, no-store, must-revalidate` (so `/`, `/about`, `/index.html`, and all SPA routes are never stale), `Strict-Transport-Security: max-age=31536000; includeSubDomains` (note: `includeSubDomains` requires **every** subdomain such as `www.` and `api.` to serve valid HTTPS; do **not** add `preload` yet), `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `! Access-Control-Allow-Origin`, and `Content-Security-Policy-Report-Only`.
  - `/assets/*` uses `! Cache-Control` + `Cache-Control: public, max-age=31536000, immutable` so hashed assets receive **exactly one** `Cache-Control` header.
- **CSP Enforcement Plan (`15.04`):**
  - CSP stays **`Content-Security-Policy-Report-Only`** for now. Keep item `15.04` as **`Verify after deploy`** until live console/CSP violation reports are reviewed and clean, then switch `Content-Security-Policy-Report-Only` to `Content-Security-Policy`.
- **Express `trust proxy` (`backend/server.js`):**
  - `app.set("trust proxy", 1)` is enabled so `express-rate-limit` uses the real visitor IP behind Cloudflare / reverse proxy instead of the proxy IP.
- **Cloudflare Dashboard:**
  - Confirm **Always Use HTTPS** is ON (`15.02`), **Brotli** is ON (`14.07`), and **Preview deployments** are enabled (`20.05`).

---

## 4. Storage, Auth, Email DNS, Webhooks & Monitoring Setup
1. **AWS S3 (`7.05`, `9.02`):** Turn **Block Public Access** ON (all 4 checkboxes) for `AWS_S3_BUCKET_NAME` and remove any public-read bucket policy.
2. **Google OAuth (`8.09`, `19.06`):** In Google Cloud Console, add `https://honeyuniversal.com` and `https://www.honeyuniversal.com` to Authorized JavaScript Origins, set Authorized Redirect URI to **`https://<api-domain>/api/auth/google/callback`** (matching `GOOGLE_CALLBACK_URL`), and confirm the OAuth consent screen brand name.
3. **Resend / Email DNS (`8.03`, `9.05`, `12.02`, `12.06`):** Verify **SPF**, **DKIM**, and **DMARC** (`_dmarc.honeyuniversal.com` TXT record) in DNS for `honeyuniversal.com` so transactional emails don't land in spam.
4. **Razorpay Webhooks (`19.02`):** Add `https://<api-domain>/api/payment/webhook` subscribed to `payment.captured`, `order.paid`, and `payment.failed` in **both** Test Mode and Live Mode — remember Test Mode and Live Mode have **different** `RAZORPAY_WEBHOOK_SECRET` values.
5. **Sentry (`20.02`) & Uptime (`20.01`):** Create a Sentry project and set `VITE_SENTRY_DSN`; add UptimeRobot/Cloudflare health check on `https://<api-domain>/api/health`.
6. **MySQL Backups (`20.04`):** Confirm automated daily backups are enabled in Hostinger for the production MySQL database.

---

## 5. Git History & Key Rotation Check
- **Frontend bundle scan (`15.10`):** Zero private secrets (`RAZORPAY_KEY_SECRET`, `RESEND_API_KEY`, `AWS_SECRET_ACCESS_KEY`, `JWT_SECRET`, `MYSQL_PASSWORD`) were found in `frontend/src` or `frontend/dist`.
- **Git history (`gitleaks`):** This local workspace directory does **not** contain a `.git` folder (`Test-Path .git` = `False`) and `gitleaks` is not installed locally, so full Git commit history could not be scanned here. Before deploying, run `gitleaks detect --source .` in your Git repository and rotate any key ever committed: `JWT_SECRET`, `SESSION_SECRET`, `MYSQL_PASSWORD`, `AWS_SECRET_ACCESS_KEY`, `RESEND_API_KEY`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`.

---

## 6. Post-Deploy Smoke Test List

### Staging / Preview Smoke Test (with `rzp_test_...` keys & test inbox)
1. **Razorpay TEST Payments (`6.03`–`6.06`, `19.01`–`19.02`):** Sign in with a test account, upload dummy `sample.pdf` (`<= 50 MB`), verify `.exe` is rejected, add to cart, open Razorpay **TEST** modal in `INR`, test cancel/retry (`6.05`), complete 1 TEST payment (`6.03`, `6.04`, `6.06`), verify `/my-orders` (`9.01`) & signed download (`9.02`), and confirm webhook delivery.
2. **Forms & Auth:** Test `/forgot-password` (`8.03`), `/my-profile` edit + password change (`9.03`), wishlist refresh/logout persistence (`9.04`), and `/contact` to a test `ADMIN_NOTIFICATION_EMAIL` (`12.02`).

### Production Smoke Test (Read-Only + Open/Cancel Check Only — NO Live Payments)
1. `curl -I https://honeyuniversal.com/` → confirm `200`, `Cache-Control: no-cache, no-store, must-revalidate`, `Strict-Transport-Security: max-age=31536000; includeSubDomains`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, no `Access-Control-Allow-Origin: *`, and `Content-Security-Policy-Report-Only`.
2. `curl -I https://honeyuniversal.com/about` → confirm `Cache-Control: no-cache, no-store, must-revalidate`.
3. `curl -I https://honeyuniversal.com/assets/<main-js-hash>.js` → confirm **exactly one** `Cache-Control: public, max-age=31536000, immutable` header.
4. `curl -I http://honeyuniversal.com/` → confirm `301`/`308` redirect to `https://`.
5. Open `/`, `/about`, `/product/...`, `/apostille/netherlands`, `/work-sample`, `/blog`, `/faq` → check `0` console errors (`14.09`), verify Cookie banner & footer `"Cookie settings"` (`16.04`), and **only open Razorpay checkout and cancel** (do not complete a live payment).

---

## 7. Rollback Procedure
- **Frontend (Cloudflare Pages):** Cloudflare Pages → **Deployments** → select the recorded previous Deployment ID → **Rollback to this deployment**.
- **Backend (Node / Hostinger):** `git checkout <recorded-commit-or-tag>` (or restore previous release archive), run `npm --prefix backend install --omit=dev`, restart the process, and verify `GET /api/health` returns `200`.
- **Database:** If needed, restore from `backup_<timestamp>.sql` (new tables/columns are additive and backward-compatible).
