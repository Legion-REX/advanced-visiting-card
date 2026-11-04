-- ========================================================
-- SUPABASE COMPLETE SETUP SCRIPT FOR ADVANCED VISITING CARD
-- ========================================================
-- Is poore code ko copy karke Supabase -> SQL Editor me Run karein.

-- 1. Customers table banayein (agar pehle se nahi bani hai)
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY,
    business_name TEXT,
    phone TEXT,
    email TEXT,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Row Level Security (RLS) enable karein
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- 3. Purani policies drop karein taaki koi conflict ya error na aaye
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.customers;
DROP POLICY IF EXISTS "Users can update their own profiles" ON public.customers;
DROP POLICY IF EXISTS "Super Admins can do everything" ON public.customers;
DROP POLICY IF EXISTS "Allow public read access" ON public.customers;
DROP POLICY IF EXISTS "Allow public insert and upsert" ON public.customers;
DROP POLICY IF EXISTS "Allow public update" ON public.customers;
DROP POLICY IF EXISTS "Allow public delete" ON public.customers;

-- 4. Policies create karein (Visiting cards public read aur app dwara sync hone ke liye)

-- A) Public Read: Har koi digital visiting card dekh sake
CREATE POLICY "Allow public read access"
ON public.customers FOR SELECT
USING (true);

-- B) Insert/Upsert: Naye cards app se cloud me save ho sakein
CREATE POLICY "Allow public insert and upsert"
ON public.customers FOR INSERT
WITH CHECK (true);

-- C) Update: Customer apne card ko edit/update kar sake
CREATE POLICY "Allow public update"
ON public.customers FOR UPDATE
USING (true)
WITH CHECK (true);

-- D) Delete: Cards delete karne ke liye
CREATE POLICY "Allow public delete"
ON public.customers FOR DELETE
USING (true);
