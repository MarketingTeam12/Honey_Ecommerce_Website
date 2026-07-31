# 🚀 Deploy Your Supabase Edge Function (Backend)

## ⚠️ IMPORTANT: Your Backend Is Not Deployed Yet!

The **502 Bad Gateway** error means your Supabase Edge Function is **not deployed**. 

Without deploying the backend:
- ❌ Orders won't save to database
- ❌ Admin panel won't work
- ❌ Payment processing won't work
- ❌ File uploads won't work

---

## 📋 Quick Deployment Steps

### **Option 1: Deploy via Supabase CLI (Recommended)**

#### Step 1: Install Supabase CLI

**Windows:**
```bash
npm install -g supabase
```

**Mac/Linux:**
```bash
brew install supabase/tap/supabase
```

Or using npm:
```bash
npm install -g supabase
```

#### Step 2: Login to Supabase

```bash
supabase login
```

This will open your browser to authenticate with Supabase.

#### Step 3: Link Your Project

```bash
supabase link --project-ref ftdvxwhjcefwnefzotac
```

When prompted:
- Enter your database password (from Supabase dashboard)

#### Step 4: Deploy the Edge Function

```bash
supabase functions deploy make-server-a67f0635
```

This will:
- ✅ Upload your Edge Function code
- ✅ Deploy it to Supabase servers
- ✅ Make it accessible via HTTPS

#### Step 5: Set Environment Secrets

```bash
supabase secrets set SUPABASE_URL=https://ftdvxwhjcefwnefzotac.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
supabase secrets set SUPABASE_ANON_KEY=your_anon_key_here
supabase secrets set SUPABASE_DB_URL=your_database_url_here
```

Get these values from:
- Supabase Dashboard → Project Settings → API

#### Step 6: Verify Deployment

```bash
supabase functions list
```

You should see `make-server-a67f0635` in the list with status "ACTIVE"

---

### **Option 2: Deploy via Supabase Dashboard (Manual)**

#### Step 1: Go to Supabase Dashboard

1. Open https://supabase.com/dashboard
2. Select your project: **ftdvxwhjcefwnefzotac**
3. Click **"Edge Functions"** in the left sidebar

#### Step 2: Create New Function

1. Click **"Deploy new function"** button
2. Name: `make-server-a67f0635`
3. Upload the code from `/supabase/functions/server/`

#### Step 3: Set Environment Variables

1. In the Edge Functions page, click on your function
2. Go to "Environment Variables" tab
3. Add these secrets:
   ```
   SUPABASE_URL = https://ftdvxwhjcefwnefzotac.supabase.co
   SUPABASE_SERVICE_ROLE_KEY = (from Project Settings → API)
   SUPABASE_ANON_KEY = (from Project Settings → API)
   SUPABASE_DB_URL = (from Project Settings → Database → Connection string)
   ```

#### Step 4: Deploy

1. Click "Deploy" button
2. Wait for deployment to complete (1-2 minutes)

---

## 🔍 How to Verify It's Working

After deployment, test your backend:

### Test 1: Check Server Status

Open this URL in your browser:
```
https://ftdvxwhjcefwnefzotac.supabase.co/functions/v1/make-server-a67f0635/setup/status
```

**Expected result:**
- You should see JSON response (not a 502 error)
- Example: `{"tableExists": false, "needsSetup": true}`

### Test 2: Check Database Setup

Go to your app:
```
/admin/diagnostics
```

You should see:
- ✅ Server Status: Backend server is running
- ❌ Database Table: TABLE MISSING (this is normal - we'll fix it next)

---

## ⚡ After Deployment: Fix the Database

Once your backend is deployed:

1. **Go to:** `/admin/diagnostics`
2. **Click:** "Auto-Fix Database" button
3. **Wait:** 30 seconds
4. **Done!** All systems working ✅

---

## 🐛 Troubleshooting

### Error: "supabase: command not found"

**Solution:** Install Supabase CLI first (see Step 1 above)

---

### Error: "Failed to link project"

**Solution:** 
1. Get your project ref from Supabase dashboard URL
2. Make sure you're logged in: `supabase login`
3. Try linking again with correct project ref

---

### Error: "Database password required"

**Solution:**
1. Go to Supabase Dashboard → Project Settings → Database
2. Reset your database password
3. Use that password when linking

---

### Error: "Secrets not set"

**Solution:**
After deployment, set secrets:
```bash
supabase secrets set SUPABASE_URL=https://ftdvxwhjcefwnefzotac.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_key_here
supabase secrets set SUPABASE_ANON_KEY=your_key_here
supabase secrets set SUPABASE_DB_URL=your_db_url_here
```

Get these from: Supabase Dashboard → Project Settings → API

---

### Still Getting 502 Error After Deployment?

**Check Edge Function Logs:**
1. Go to Supabase Dashboard
2. Edge Functions → make-server-a67f0635
3. Click "Logs" tab
4. Look for error messages

**Common Issues:**
- Missing environment variables (set them in dashboard)
- Function crashed on startup (check logs)
- Supabase project paused (unpause it in dashboard)

---

## 📚 Additional Resources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Supabase CLI Docs](https://supabase.com/docs/reference/cli/introduction)
- [Edge Functions Deployment Guide](https://supabase.com/docs/guides/functions/deploy)

---

## ✅ Success Checklist

After deployment, you should have:

- [x] Backend deployed and running (no 502 error)
- [x] Environment secrets configured
- [x] Server status endpoint working
- [x] Database table created (via /admin/diagnostics)
- [x] Orders saving to database
- [x] Admin panel showing orders
- [x] Full application functionality

---

**Ready to deploy? Start with Option 1 above!** 🚀
