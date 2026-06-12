-- Add first_name and last_name to profiles table
-- Drop the old "name" column and replace with first_name and last_name

BEGIN;

-- Add new columns
ALTER TABLE profiles
ADD COLUMN first_name text DEFAULT '',
ADD COLUMN last_name text DEFAULT '';

-- Migrate existing data from name to first_name
UPDATE profiles
SET first_name = COALESCE(name, '')
WHERE name IS NOT NULL;

-- Drop old name column
ALTER TABLE profiles
DROP COLUMN name;

-- Create index for searching by name
CREATE INDEX IF NOT EXISTS idx_profiles_name 
ON profiles(first_name, last_name);

COMMIT;
