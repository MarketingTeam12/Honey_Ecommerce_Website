-- ============================================================================
-- QUICK FIX: Create Missing Orders Table
-- ============================================================================
-- Copy this entire script and paste it into Supabase SQL Editor, then click Run
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.kv_store_a67f0635 (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kv_store_a67f0635_created_at 
ON public.kv_store_a67f0635(created_at DESC);

ALTER TABLE public.kv_store_a67f0635 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON public.kv_store_a67f0635 FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated read" ON public.kv_store_a67f0635 FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anon read" ON public.kv_store_a67f0635 FOR SELECT TO anon USING (true);
CREATE POLICY "Anon insert" ON public.kv_store_a67f0635 FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon update" ON public.kv_store_a67f0635 FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon delete" ON public.kv_store_a67f0635 FOR DELETE TO anon USING (true);

-- ✅ Done! Now check /admin/orders-diagnostics to verify
