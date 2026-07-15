-- Remove unique constraint from user_branches to allow updating branch assignments multiple times
-- This allows admins to reassign branches without encountering unique constraint violations

ALTER TABLE user_branches
DROP CONSTRAINT IF EXISTS user_branches_user_id_branch_id_key;
