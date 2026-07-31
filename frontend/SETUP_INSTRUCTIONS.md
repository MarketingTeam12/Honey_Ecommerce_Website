# Honey Translation Services - Setup Instructions

## ✅ Current Status

Your application is set up and running! However, there's one manual step required for **Storage Buckets**.

## 🪣 Storage Bucket Setup (Required)

### Why This Step Is Needed

Supabase Storage has Row Level Security (RLS) enabled by default on the `storage.buckets` table, which prevents automatic bucket creation even with service role credentials. This is a security feature that requires manual bucket creation through the Supabase Dashboard.

### Error You're Seeing

```
❌ Error creating bucket: StorageApiError: new row violates row-level security policy
```

This error appears when the application tries to upload images or files but the required storage buckets don't exist yet.

### Quick Fix (5 minutes)

1. **Open your Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project
   - Click **Storage** in the left sidebar

2. **Create Bucket 1: Product Images**
   - Click "**New bucket**"
   - **Name:** `product-images-a67f0635`
   - Toggle "**Public bucket**" to **ON**
   - **File size limit:** `10 MB` (10485760 bytes)
   - Click "**Create bucket**"

3. **Create Bucket 2: Work Samples**
   - Click "**New bucket**" again
   - **Name:** `work-samples-a67f0635`
   - Toggle "**Public bucket**" to **ON**
   - **File size limit:** `50 MB` (52428800 bytes)
   - Click "**Create bucket**"

4. **Verify Setup**
   - Both buckets should now appear in your Storage section
   - Try uploading an image or file in your application
   - The errors should disappear!

### Detailed Guide

For step-by-step instructions with screenshots, see [`STORAGE_SETUP_GUIDE.md`](./STORAGE_SETUP_GUIDE.md)

### Verify Status Programmatically

You can check if buckets are configured correctly by visiting:
```
https://[your-project-id].supabase.co/functions/v1/make-server-a67f0635/storage/check-buckets
```

## 🎯 What These Buckets Are Used For

- **product-images-a67f0635**: Admin panel product image uploads
- **work-samples-a67f0635**: Portfolio work samples displayed on the website

## ⚠️ Important Notes

- Bucket names are **case-sensitive** and must match exactly
- Both buckets must be **public** for images to be accessible
- Don't skip this step - file uploads won't work without these buckets

## 🚀 After Setup

Once the buckets are created:

1. ✅ All file uploads will work correctly
2. ✅ Admin panel image management will function
3. ✅ Portfolio work samples will display properly
4. ✅ No more RLS policy errors in logs

## 🆘 Need Help?

If you continue to see errors after creating the buckets:

1. Verify bucket names match exactly (including the `-a67f0635` suffix)
2. Ensure both buckets are set to **public**
3. Check file size limits are set correctly
4. Review the Edge Function logs for specific error messages

## Alternative: Disable RLS (Advanced)

If you prefer automatic bucket creation, you can disable RLS on the storage.buckets table:

**⚠️ Warning:** This reduces security slightly. Only do this if you understand the implications.

1. Go to **SQL Editor** in Supabase Dashboard
2. Run: `ALTER TABLE storage.buckets DISABLE ROW LEVEL SECURITY;`
3. Restart your Edge Function
4. Buckets will be created automatically

---

**That's it!** Once the storage buckets are created, your application will be fully functional.
