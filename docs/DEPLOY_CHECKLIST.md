# Deployment Checklist – Honey Universal Services (`honeyuniversal.com`)

**Prepared by:** Mano Rakshahan  
**Architecture:** Single Node.js Application on Hostinger (Serving built React frontend + Express API)  
**Important:** Never commit real secret values to Git. Set secrets only in your hosting/environment dashboards or server `.env` files.

---

## 1. Hostinger hPanel Node.js App Settings (Single App Deployment)

In Hostinger hPanel → **Websites** → **Node.js**:

| Setting | Value | Notes |
|---|---|---|
| **Application root** | `.` (project root) | The root directory where `package.json` resides |
| **Application URL / Domain** | `honeyuniversal.com` (or `www.honeyuniversal.com`) | Unified domain for both frontend & backend |
| **Node.js version** | `18.x` or `20.x` | Matches `"engines": { "node": ">=18" }` |
| **Application startup file** | `backend/server.js` | Direct entry point for Node / Phusion Passenger |
| **Build command** | `npm run build` | Runs `npm --prefix frontend install && npm --prefix frontend run build && npm --prefix backend install --omit=dev` |
| **Start command** | `npm start` | Runs `node backend/server.js` |

---

## 2. Database Set-Up Steps (Hostinger MySQL)

1. **Back up the existing production MySQL database** before any deployment:
   ```bash
   mysqldump -h <MYSQL_HOST> -P <MYSQL_PORT> -u <MYSQL_USER> -p --single-transaction --routines --triggers <MYSQL_DATABASE> > backup_$(date +%F_%H%M).sql
   ```
2. **Hostinger Remote MySQL Access:**
   - In hPanel → **Databases** → **Remote MySQL**, ensure the server IP / host (`srv1118.hstgr.io` or `localhost` if co-located) is allowed and credentials match `backend/.env`.
3. **Additive Database Migrations:**
   - Automatically executed on backend startup via `initializeDatabase()` in `backend/config/database.js`.
   - Alternatively, execute manually in phpMyAdmin / MySQL CLI before restarting:
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

---

## 3. Environment Variables (Hostinger hPanel / Server `.env`)

### Frontend Build Variables (Used during `npm run build` in `frontend/`)
| Variable | Value / Purpose | Notes |
|---|---|---|
| `VITE_API_BASE_URL` | `/api` | Relative path since frontend and API share the same origin |
| `VITE_RAZORPAY_KEY_ID` | `rzp_test_...` or `rzp_live_...` | Public Razorpay Key ID |
| `VITE_SENTRY_DSN` | Optional Sentry DSN | Leave empty until configured |
| `VITE_TURNSTILE_SITE_KEY` | Optional Cloudflare Turnstile site key | Optional |

### Backend Variables (`backend/.env` on Hostinger)
| Variable | Purpose | Notes |
|---|---|---|
| `PORT` | `3000` (or injected by Hostinger) | Server listen port |
| `NODE_ENV` | `production` | Enables production security & optimizations |
| `FRONTEND_URL` | `https://honeyuniversal.com,https://www.honeyuniversal.com,https://darkorange-weasel-454822.hostingersite.com` | Allowed CORS origins (comma-separated; includes Hostinger test domain & staging domains) |
| `BACKEND_PUBLIC_URL` | `https://honeyuniversal.com` | Public URL for email links |
| `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE` | Hostinger MySQL credentials | Strong credentials |
| `JWT_SECRET` | Signs user session tokens | High-entropy random string |
| `SESSION_SECRET` | Express session secret | High-entropy random string |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` | Google OAuth 2.0 | Callback: `https://honeyuniversal.com/api/auth/google/callback` |
| `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET_NAME` | AWS S3 document storage | Private bucket with Block Public Access enabled |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Razorpay order & HMAC verification | Test keys for staging; Live keys for prod |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook signature verification | Configured in Razorpay Dashboard for `/api/payment/webhook` |
| `RESEND_API_KEY` | Resend email API key | For transactional emails |
| `RESEND_FROM_EMAIL` | Verified sender (e.g. `Honey Translations <noreply@honeyuniversal.com>`) | Domain verified in DNS |
| `ADMIN_EMAIL` | Destination for deletion requests (`/api/auth/request-deletion`) | Required admin email |
| `ADMIN_NOTIFICATION_EMAIL` | Destination for contact form alerts | Official support inbox |

---

## 4. Deployment Order (Follow Strictly)
1. **Back up the production MySQL database.**
2. **Pull the latest code** on branch `audit-fixes` (or `main` after PR merge).
3. **Execute build:** `npm run build` (builds `frontend/dist` and installs backend production dependencies).
4. **Restart Node.js process** in Hostinger hPanel.
5. **Verify health endpoint immediately:** `curl -I https://honeyuniversal.com/api/health` → `200 OK`.

---

## 5. Security Headers & Static Asset Caching
Express serves the built frontend with `helmet`:
- `Cache-Control: no-cache, no-store, must-revalidate` for `/`, `/about`, and all HTML/SPA fallback routes.
- `Cache-Control: public, max-age=31536000, immutable` for `/assets/*` hashed static files.
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`.
- `X-Frame-Options: SAMEORIGIN` and `frame-ancestors 'self'`.
- `X-Content-Type-Options: nosniff`.
- `Referrer-Policy: strict-origin-when-cross-origin`.
- `Content-Security-Policy-Report-Only` matching the CSP directives in `_headers`.
- `CORS`: Restricted strictly to `https://honeyuniversal.com`, `https://www.honeyuniversal.com` (and localhost in dev). All wildcard and ngrok origins removed.

---

## 6. Post-Deploy Smoke Test List
1. `curl -I https://honeyuniversal.com/` → confirm `200`, `Cache-Control: no-cache, no-store, must-revalidate`, security headers present.
2. `curl -I https://honeyuniversal.com/about` → confirm `200`, `Cache-Control: no-cache, no-store, must-revalidate` (SPA fallback).
3. `curl -I https://honeyuniversal.com/assets/<hash>.js` → confirm `Cache-Control: public, max-age=31536000, immutable`.
4. `curl -I https://honeyuniversal.com/api/health` → confirm `200 OK` JSON response.
5. `curl -I https://honeyuniversal.com/api/unknown-endpoint` → confirm `404 Not Found` JSON response.
6. Test customer login, registration, and profile update.
7. Test Razorpay checkout modal opening and cancel.

---

## 7. Rollback Procedure
- **Code Rollback:** `git checkout <previous-commit-or-tag>`, run `npm run build`, and restart Node.js in hPanel.
- **Database Rollback:** If needed, restore from `backup_<timestamp>.sql`.
