-- Fix RLS policies on profiles table to allow staff to read all profiles
-- This is needed for the history page to display user names when joining with stock_movements

-- Drop the existing restrictive "Users read own profile" policy
DROP POLICY IF EXISTS "Users read own profile" ON profiles;

-- Drop the "Staff read all profiles" policy if it exists (we'll recreate it)
DROP POLICY IF EXISTS "Staff read all profiles" ON profiles;

-- Create policy allowing authenticated staff to read all profiles
-- This is necessary for joins in the history page to work correctly
CREATE POLICY "Authenticated users read all profiles"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- Keep the admin update policy
-- Admin update policy already exists, no need to change it
