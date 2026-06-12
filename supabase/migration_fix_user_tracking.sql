-- Fix user_id foreign key to reference profiles instead of auth.users

-- Drop dependent RLS policies first
DROP POLICY IF EXISTS "Staff insert stock_movements" ON stock_movements;
DROP POLICY IF EXISTS "Staff read stock_movements" ON stock_movements;
DROP POLICY IF EXISTS "Admin full access on stock_movements" ON stock_movements;

-- Drop the existing column
ALTER TABLE stock_movements
DROP COLUMN IF EXISTS user_id CASCADE;

-- Re-add user_id with correct foreign key
ALTER TABLE stock_movements
ADD COLUMN user_id uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_stock_movements_user_id 
ON stock_movements(user_id);

-- Recreate RLS policies
CREATE POLICY "Admin full access on stock_movements"
  ON stock_movements FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Staff read stock_movements"
  ON stock_movements FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Staff insert stock_movements"
  ON stock_movements FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
