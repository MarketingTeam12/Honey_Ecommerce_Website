# Demo User Setup Guide

## Issue
The Admin Dashboard is showing a **401 "Invalid JWT"** error when trying to fetch dashboard statistics.

```
❌ [Dashboard] Backend error: {"code":401,"message":"Invalid JWT"}
```

## Why This Happens
The application uses demo/mock credentials for authentication (`admin@honeytranslations.com` / `admin123`), but these users need to exist in your Supabase Auth system for JWT tokens to be generated.

Supabase Edge Functions validate JWT tokens **before** the request reaches your handler code, so even though your server has demo mode enabled, the Supabase infrastructure rejects invalid JWTs.

## ✅ Solution: Create Demo Users in Supabase Auth

You have **two options** to fix this:

### Option 1: Use the Automated Initialization Endpoint (Recommended)

1. **Open your browser** and navigate to: `/init-demo` page in your application
   - URL: `http://localhost:5173/init-demo` (or your deployed URL)
   
2. **Click the "Initialize Demo Users" button**
   - This will call the backend `/init-demo-users` endpoint
   - It creates both admin and customer demo accounts

3. **Verify success**
   - You should see success messages
   - Try logging in with `admin@honeytranslations.com` / `admin123`

### Option 2: Manual Setup via Supabase Dashboard

1. **Go to Supabase Dashboard** → **Authentication** → **Users**

2. **Create Admin User:**
   - Click "Add user" → "Create new user"
   - Email: `admin@honeytranslations.com`
   - Password: `admin123`
   - Auto Confirm User: ✅ **YES**
   - Click "Create user"

3. **Create Customer User (Optional):**
   - Email: `customer@honeytranslations.com`
   - Password: `customer123`
   - Auto Confirm User: ✅ **YES**

4. **Set Admin Role:**
   - After creating the admin user, note their User ID
   - Go to **Database** → **Table Editor** → Create `user_profiles` table if it doesn't exist
   - Add a row with:
     - `id`: [admin user's UUID]
     - `email`: `admin@honeytranslations.com`
     - `role`: `admin`
     - `name`: `Admin User`

### Option 3: Call the Backend Endpoint Directly

Open your browser console and run:

```javascript
fetch('https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-a67f0635/init-demo-users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_ANON_KEY'
  }
}).then(r => r.json()).then(console.log);
```

Replace:
- `YOUR_PROJECT_ID` with your Supabase project ID
- `YOUR_ANON_KEY` with your Supabase anon key

## 🔍 Verification

After creating demo users, verify the fix:

1. **Check the browser console** - You should see:
   ```
   ✅ [buildHeaders] Demo JWT token initialized successfully
   🔐 Token type: jwt
   ```

2. **Navigate to `/admin`** - Dashboard should load without 401 errors

3. **Check the Network tab** - Requests to `/admin/dashboard-stats` should return 200

## 📋 What the Initialization Does

The `/init-demo-users` endpoint creates:

1. **Admin User:**
   - Email: `admin@honeytranslations.com`
   - Password: `admin123`
   - Role: `admin`
   - Name: `Admin User`

2. **Customer User:**
   - Email: `customer@honeytranslations.com`
   - Password: `customer123`
   - Role: `customer`
   - Name: `Test Customer`

Both users are:
- ✅ Auto-confirmed (no email verification needed)
- ✅ Stored in Supabase Auth
- ✅ Have profiles in the KV store

## 🔧 Technical Details

### Why This Fix Works:

1. **Before Fix:**
   - App sends mock token (`'mock-token-1'`)
   - `buildHeaders()` falls back to `publicAnonKey`
   - Supabase Edge Functions reject the token as invalid JWT
   - Request fails with 401 before reaching handler

2. **After Fix:**
   - App calls `/demo-token` endpoint during initialization
   - Backend signs in as `admin@honeytranslations.com`
   - Returns a **real, valid JWT** from Supabase Auth
   - All subsequent requests use this valid JWT
   - Supabase Edge Functions accept the request
   - Handler code runs successfully

### JWT Token Flow:

```
App Initialization
  ↓
Call /demo-token endpoint
  ↓
Backend: supabase.auth.signInWithPassword('admin@honeytranslations.com', 'admin123')
  ↓
Returns session.access_token (valid JWT)
  ↓
Store in demoToken variable
  ↓
All API calls use this JWT
  ↓
✅ Success!
```

## ⚠️ Important Notes

- **Demo users must exist** in Supabase Auth for JWT generation to work
- The **app waits** for demo token initialization before rendering (prevents race conditions)
- If initialization fails, app falls back to `publicAnonKey` (may still cause 401s)
- Run `/init-demo-users` only **once** per Supabase project

## 🎯 After Setup

Once demo users are created:
- ✅ Admin dashboard loads without errors
- ✅ All authenticated endpoints work correctly
- ✅ No more "Invalid JWT" errors
- ✅ Demo mode functions as intended

---

**Need Help?** The demo users only need to be created once. After that, JWT tokens are automatically generated on every app load.
