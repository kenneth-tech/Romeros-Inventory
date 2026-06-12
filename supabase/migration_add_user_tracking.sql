-- Add user tracking to stock_movements table
-- This migration tracks which user performed each stock in/out operation

-- Add user_id column to stock_movements
ALTER TABLE stock_movements
ADD COLUMN user_id uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- Update RLS policies to include user_id
-- Staff can insert movements and see all movements
DROP POLICY IF EXISTS "Staff insert stock_movements" ON stock_movements;
DROP POLICY IF EXISTS "Staff read stock_movements" ON stock_movements;

CREATE POLICY "Staff read stock_movements"
  ON stock_movements FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Staff insert stock_movements"
  ON stock_movements FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    user_id = auth.uid()
  );

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_stock_movements_user_id 
ON stock_movements(user_id);
