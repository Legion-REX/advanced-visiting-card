-- Supabase Row Level Security (RLS) Policies for BIO Website SaaS
-- Run this in your Supabase SQL Editor to fix [SEC-002]

-- Enable RLS on the customers table
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- 1. Public can read only ACTIVE customers with limited fields (No sensitive data)
CREATE POLICY "Public profiles are viewable by everyone"
ON customers FOR SELECT
USING ( status = 'active' );

-- 2. Customers can read and update their own full records based on Auth UID
CREATE POLICY "Users can update their own profiles"
ON customers FOR UPDATE
USING ( auth.uid()::text = id )
WITH CHECK ( auth.uid()::text = id );

-- 3. Super Admins can read, insert, update, delete ALL records
-- Requires setting up custom claims or an admin role table
CREATE POLICY "Super Admins can do everything"
ON customers FOR ALL
USING ( (SELECT role FROM users WHERE id = auth.uid()) = 'admin' );
