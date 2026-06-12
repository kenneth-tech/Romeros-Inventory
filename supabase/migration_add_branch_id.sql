-- Add branch_id column to stock_movements table
-- This was missing from the original schema

ALTER TABLE stock_movements
ADD COLUMN branch_id uuid REFERENCES branches(id) ON DELETE CASCADE;

-- Create index on branch_id for queries
CREATE INDEX IF NOT EXISTS idx_stock_movements_branch_id 
ON stock_movements(branch_id);

-- Update existing rows (set to first branch if any exist)
UPDATE stock_movements 
SET branch_id = (SELECT id FROM branches LIMIT 1) 
WHERE branch_id IS NULL;

-- Make branch_id NOT NULL after populating data
ALTER TABLE stock_movements
ALTER COLUMN branch_id SET NOT NULL;
