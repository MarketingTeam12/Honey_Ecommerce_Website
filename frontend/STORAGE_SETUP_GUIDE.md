# Supabase Storage Setup Guide

## Problem

You're seeing this error:
```
❌ Error creating bucket: StorageApiError: new row violates row-level security policy
```

This happens because Supabase Storage has Row Level Security (RLS) enabled on the `storage.buckets` table, which prevents programmatic bucket creation even with the service role key.

## Solution: Create Storage Buckets Manually

You need to manually create the required storage buckets in your Supabase Dashboard.

### Step 1: Access Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **Storage** in the left sidebar

### Step 2: Create Required Buckets

Create the following public storage buckets:

#### Bucket 1: `product-images-a67f0635`
- **Name:** `product-images-a67f0635`
- **Public:** ✅ Yes (toggle ON)
- **File size limit:** 10 MB (10485760 bytes)
- **Allowed MIME types:** Leave empty (allow all images)

#### Bucket 2: `work-samples-a67f0635`
- **Name:** `work-samples-a67f0635`
- **Public:** ✅ Yes (toggle ON)
- **File size limit:** 50 MB (52428800 bytes)
- **Allowed MIME types:** Leave empty (allow all files)

### Step 3: Create Buckets

For each bucket:

1. Click "**New bucket**" button in Storage
2. Enter the bucket name exactly as shown above
3. Toggle "**Public bucket**" to ON
4. Set the file size limit
5. Click "**Create bucket**"

### Step 4: Verify Setup

After creating both buckets, you should see them listed in your Storage section.

## Alternative Solution: Disable RLS on storage.buckets (Not Recommended)

If you prefer programmatic bucket creation, you can disable RLS on the storage.buckets table:

1. Go to **SQL Editor** in Supabase Dashboard
2. Run this SQL command:
   ```sql
   ALTER TABLE storage.buckets DISABLE ROW LEVEL SECURITY;
   ```
3. This will allow the Edge Function to create buckets automatically

⚠️ **Warning:** This reduces security slightly as it allows any service with the service role key to create buckets.

## Verification

After setting up the buckets, try uploading a file or image in your application. The errors should disappear.

## Need Help?

If you continue to see errors:

1. Verify the bucket names match exactly (case-sensitive)
2. Ensure buckets are set to **public**
3. Check that file size limits are set correctly
4. Review the Edge Function logs for specific errors

## Bucket Usage

- **product-images-a67f0635**: Used for admin product image uploads
- **work-samples-a67f0635**: Used for storing portfolio work samples

