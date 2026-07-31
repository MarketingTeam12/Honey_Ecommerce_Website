-- ============================================================================
-- HONEY TRANSLATION SERVICES - ORDERS DATABASE SETUP
-- ============================================================================
-- This SQL script creates the missing kv_store table needed for orders
-- to appear in the admin panel.
--
-- INSTRUCTIONS:
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to SQL Editor
-- 3. Copy and paste this entire script
-- 4. Click "Run" to execute
-- ============================================================================

-- Step 1: Create the kv_store table for orders
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.kv_store_a67f0635 (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create index for faster queries
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_kv_store_a67f0635_created_at 
ON public.kv_store_a67f0635(created_at DESC);

-- Step 3: Enable Row Level Security (RLS)
-- ============================================================================
ALTER TABLE public.kv_store_a67f0635 ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies for admin access
-- ============================================================================

-- Policy 1: Allow service_role (backend) full access
CREATE POLICY "Service role has full access to kv_store_a67f0635"
ON public.kv_store_a67f0635
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy 2: Allow authenticated users to read all orders
CREATE POLICY "Authenticated users can read kv_store_a67f0635"
ON public.kv_store_a67f0635
FOR SELECT
TO authenticated
USING (true);

-- Policy 3: Allow anon users to read (needed for Edge Functions)
CREATE POLICY "Anon users can read kv_store_a67f0635"
ON public.kv_store_a67f0635
FOR SELECT
TO anon
USING (true);

-- Policy 4: Allow anon users to insert (needed for Edge Functions)
CREATE POLICY "Anon users can insert into kv_store_a67f0635"
ON public.kv_store_a67f0635
FOR INSERT
TO anon
WITH CHECK (true);

-- Policy 5: Allow anon users to update (needed for Edge Functions)
CREATE POLICY "Anon users can update kv_store_a67f0635"
ON public.kv_store_a67f0635
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- Policy 6: Allow anon users to delete (needed for Edge Functions)
CREATE POLICY "Anon users can delete from kv_store_a67f0635"
ON public.kv_store_a67f0635
FOR DELETE
TO anon
USING (true);

-- Step 5: Create function to auto-update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_kv_store_a67f0635_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger for auto-updating updated_at
-- ============================================================================
DROP TRIGGER IF EXISTS trigger_update_kv_store_a67f0635_updated_at ON public.kv_store_a67f0635;
CREATE TRIGGER trigger_update_kv_store_a67f0635_updated_at
    BEFORE UPDATE ON public.kv_store_a67f0635
    FOR EACH ROW
    EXECUTE FUNCTION public.update_kv_store_a67f0635_updated_at();

-- ============================================================================
-- VERIFICATION QUERIES (Optional - run these to verify setup)
-- ============================================================================

-- Check if table exists and show structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'kv_store_a67f0635'
ORDER BY ordinal_position;

-- Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'kv_store_a67f0635';

-- Check policies
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'kv_store_a67f0635';

-- Count existing orders in the table
SELECT COUNT(*) as total_orders FROM public.kv_store_a67f0635 WHERE key LIKE 'order:%';

-- Show sample of orders (if any exist)
SELECT 
    key,
    value->>'order_number' as order_number,
    value->>'customer_email' as customer_email,
    value->>'total_amount' as total_amount,
    value->>'status' as status,
    created_at
FROM public.kv_store_a67f0635
WHERE key LIKE 'order:%'
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- MIGRATION: Move orders from localStorage to database (if needed)
-- ============================================================================
-- Note: This migration needs to be done from the frontend since localStorage
-- is browser-based. The Orders Diagnostics page at /admin/orders-diagnostics
-- provides tools to help with this migration.
-- ============================================================================

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================
-- After running this script:
-- 1. Go to /admin/orders-diagnostics to verify the setup
-- 2. Check if orders from localStorage need to be migrated to the database
-- 3. Place new test orders to verify they appear in the admin panel
-- ============================================================================
