# Honey Universal Services – Production Handover & Operations Manual

**Production Domain:** [https://honeyuniversal.com](https://honeyuniversal.com) and [https://www.honeyuniversal.com](https://www.honeyuniversal.com)  
**Hosting Infrastructure:** Hostinger Cloud / LiteSpeed Web Server + Node.js Runtime + Remote MySQL  
**Repository (GitHub):** `MarketingTeam12/Honey_Ecommerce_Website`  
**Active Production Branch:** `main` (Staging / Audit Branch: `audit-fixes`)  
**Document Version:** 1.0.0 (November 2026)  

---

## 1. System Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        User & Browser Traffic                          │
│               https://honeyuniversal.com (HTTP/2, HTTP/3)               │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Hostinger LiteSpeed Reverse Proxy                    │
│    • SSL Termination (Let's Encrypt Lifetime Cert for root & www)      │
│    • Edge Gzip / Brotli Compression & HTTP/3 QUIC                      │
│    • HSTS, X-Content-Type-Options, Frame-Options, Helmet Headers       │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     Node.js / Express Backend                          │
│                        (backend/server.js)                             │
│    • Entry Point: backend/server.js (Listens on process.env.PORT)      │
│    • API Routes: /api/* (Mounted from backend/routes/)                 │
│    • Static React App: frontend/dist (Fallback to index.html for SPA)  │
└────────────────────┬───────────────────────────────┬───────────────────┘
                     │                               │
                     ▼                               ▼
       ┌───────────────────────────┐   ┌───────────────────────────┐
       │   Hostinger Remote MySQL  │   │    External Integrations  │
       │   • Users & Roles         │   │    • Razorpay (Payments)  │
       │   • Orders & Items        │   │    • Resend (Emails)      │
       │   • Products & Categories │   │    • AWS S3 (Documents)   │
       │   • Enquiries & Contacts  │   │    • Google (OAuth)       │
       └───────────────────────────┘   └───────────────────────────┘
```

---

## 2. Environment Variables Configuration

All backend environment variables are managed directly in **hPanel &rarr; Websites &rarr; Manage &rarr; Node.js &rarr; Environment Variables**.

> [!CAUTION]
> Never commit actual passwords, private secrets, or API keys into git. Only update them in hPanel or local untracked `.env` files.

### Production Environment Variables Reference
| Variable Name | Description | Example / Current Setting |
| :--- | :--- | :--- |
| `NODE_ENV` | Runtime environment | `production` |
| `PORT` | Listening port (assigned by Hostinger) | Provided dynamically by Hostinger |
| `FRONTEND_URL` | Allowed CORS origins (comma-separated) | `https://honeyuniversal.com,https://www.honeyuniversal.com` |
| `DB_HOST` | Hostinger MySQL database host | (Hostinger MySQL Hostname) |
| `DB_NAME` | Database schema name | (Hostinger MySQL Database) |
| `DB_USER` | Database username | (Hostinger MySQL User) |
| `DB_PASSWORD` | Database password | (Hostinger Secret) |
| `JWT_SECRET` | Secret key for signing customer JWT tokens | (High-entropy secret string) |
| `RAZORPAY_KEY_ID` | Razorpay public key ID | `rzp_test_...` (or `rzp_live_...` for live money) |
| `RAZORPAY_KEY_SECRET` | Razorpay secret key | (Razorpay private secret) |
| `RESEND_API_KEY` | Resend API key for transactional emails | `re_...` |
| `RESEND_FROM_EMAIL` | Verified sending address for notification emails | `salesteam@honeytranslations.com` |
| `AWS_ACCESS_KEY_ID` | Amazon S3 access key for document uploads | (AWS S3 Key) |
| `AWS_SECRET_ACCESS_KEY` | Amazon S3 secret access key | (AWS S3 Secret) |
| `AWS_REGION` | AWS S3 bucket region | `ap-south-1` |
| `AWS_S3_BUCKET_NAME` | AWS S3 bucket name | (Your private bucket name) |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | (Obtained from Google Cloud Console) |
| `GOOGLE_CLIENT_SECRET`| Google OAuth Client Secret | (Obtained from Google Cloud Console) |

---

## 3. How to Switch to Live Payments (Go-Live Runbook)

When ready to accept real payments from customers:
1. Log in to the [Razorpay Dashboard](https://dashboard.razorpay.com/#/access/api_keys).
2. Toggle from **Test Mode** to **Live Mode**.
3. Generate a new **Live Key ID** (`rzp_live_...`) and **Key Secret**.
4. Log in to **Hostinger hPanel &rarr; Websites &rarr; `honeyuniversal.com` &rarr; Node.js &rarr; Environment Variables**.
5. Update:
   - `RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXXXXXX`
   - `RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXXXXXX`
6. Click **Save** and restart the Node.js application in hPanel.
7. (Optional Webhook): In Razorpay Dashboard &rarr; Webhooks, create a webhook pointing to `https://honeyuniversal.com/api/payment-webhook` subscribing to `order.paid` and `payment.captured`.

---

## 4. How to Enable One-Click Google Sign-In

1. Go to the [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials).
2. Select or create your project.
3. Under **OAuth 2.0 Client IDs**, edit your Web application credential:
   - **Authorized JavaScript Origins:**
     - `https://honeyuniversal.com`
     - `https://www.honeyuniversal.com`
   - **Authorized Redirect URIs:**
     - `https://honeyuniversal.com/api/auth/google/callback`
     - `https://www.honeyuniversal.com/api/auth/google/callback`
4. Copy the **Client ID** and **Client Secret**.
5. In hPanel Environment Variables, set:
   - `GOOGLE_CLIENT_ID=<Your_Client_ID>`
   - `GOOGLE_CLIENT_SECRET=<Your_Client_Secret>`
6. Restart the Node.js application.

---

## 5. Deployment & Update Workflow

Whenever updates are made to the codebase:
1. Test and build locally:
   ```powershell
   cd frontend
   npm run build
   ```
2. Commit and push changes:
   ```bash
   git add .
   git commit -m "Your descriptive commit message"
   git push origin audit-fixes
   git checkout main
   git merge audit-fixes
   git push origin main
   ```
3. Hostinger auto-deploys from the `main` branch:
   - Runs `npm run build`
   - Serves updated static assets from `frontend/dist`
   - Keeps `backend/server.js` running without interruption.

---

## 6. Verification & Health Monitoring

To quickly verify website health from any terminal:
```bash
# Check Backend & Database Health
curl -s https://honeyuniversal.com/api/health
# Response: {"status":"ok","message":"Server is running","storage":"mysql"}

# Check Products Catalog
curl -sI https://honeyuniversal.com/api/products
# Response: HTTP/1.1 200 OK

# Check AI Manifest
curl -s https://honeyuniversal.com/llms.txt
# Response: Standardized LLM Knowledge Base
```
