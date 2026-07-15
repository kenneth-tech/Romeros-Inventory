-- ============================================================
-- User Branches Management Table
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Create user_branches table to track which branches each user can access
create table if not exists user_branches (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  branch_id        uuid not null references branches(id) on delete cascade,
  created_at       timestamptz not null default now()
);

-- Add first_name and last_name columns to profiles if they don't exist
alter table profiles add column if not exists first_name text;
alter table profiles add column if not exists last_name text;

alter table user_branches enable row level security;

-- Admin: full access
create policy "Admin full access on user_branches"
  on user_branches for all
  using (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');

-- Users can see their own branch assignments
create policy "Users read own branch assignments"
  on user_branches for select
  using (auth.uid() = user_id);

grant select, insert, update, delete on table public.user_branches to authenticated;
