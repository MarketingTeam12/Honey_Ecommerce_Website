# 🔧 Quick Fix for Storage RLS Error

## The Error

```
❌ Error creating bucket: StorageApiError: new row violates row-level security policy
```

## What's Happening

Your Supabase Storage has Row Level Security (RLS) enabled, which prevents automatic bucket creation through the API. **This is normal and expected behavior.**

## ✅ The Fix (Takes 2 minutes)

### Option 1: Use the Built-in Setup Page

1. Open your app and go to: **`/storage-setup`**
2. Click "Check Status" to see which buckets are missing
3. Follow the on-screen instructions to create them in Supabase Dashboard

### Option 2: Manual Setup in Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Open your project
3. Click **Storage** in the sidebar
4. Create these two buckets:

   **Bucket 1:**
   - Name: `product-images-a67f0635`
   - Public: ✅ YES
   - File size limit: 10 MB

   **Bucket 2:**
   - Name: `work-samples-a67f0635`
   - Public: ✅ YES
   - File size limit: 50 MB

5. That's it! The errors will disappear.

### Option 3: Check Status via API

Visit this URL in your browser:
```
https://[your-project-id].supabase.co/functions/v1/make-server-a67f0635/storage/check-buckets
```

## Why This Happens

Supabase protects the `storage.buckets` table with RLS by default. Even with service role credentials, creating buckets programmatically is restricted for security reasons. Manual creation through the dashboard is the recommended approach.

## After Setup

Once buckets are created:
- ✅ File uploads will work
- ✅ Image management will function
- ✅ No more RLS errors
- ✅ All features fully operational

## Need More Help?

- **Detailed guide:** See `STORAGE_SETUP_GUIDE.md`
- **Full instructions:** See `SETUP_INSTRUCTIONS.md`
- **Setup status page:** Navigate to `/storage-setup` in your app

---

**Note:** This is a one-time setup. Once completed, the buckets persist and you won't need to do this again.
