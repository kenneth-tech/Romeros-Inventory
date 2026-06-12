-- ============================================================
-- Branches Migration
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ─────────────────────────────────────────
-- 1. BRANCHES TABLE
-- ─────────────────────────────────────────
create table if not exists branches (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  address    text not null default '',
  created_at timestamptz not null default now()
);

alter table branches enable row level security;

create policy "Authenticated read branches"
  on branches for select
  using (auth.role() = 'authenticated');

create policy "Admin full access on branches"
  on branches for all
  using (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');

-- Allow all authenticated users to insert branches
-- (so the owner can add branches without needing admin JWT claim)
create policy "Authenticated insert branches"
  on branches for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated update branches"
  on branches for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Authenticated delete branches"
  on branches for delete
  using (auth.role() = 'authenticated');

grant select, insert, update, delete on table public.branches to authenticated;
grant select on table public.branches to anon;


-- ─────────────────────────────────────────
-- 2. ADD branch_id TO PARTS
-- ─────────────────────────────────────────
alter table parts
  add column if not exists branch_id uuid references branches(id) on delete cascade;

-- Drop old global unique on part_number, replace with per-branch unique
alter table parts drop constraint if exists parts_part_number_key;
alter table parts add constraint parts_part_number_branch_id_key
  unique (part_number, branch_id);


-- ─────────────────────────────────────────
-- 3. ADD branch_id TO STOCK_MOVEMENTS
-- ─────────────────────────────────────────
alter table stock_movements
  add column if not exists branch_id uuid references branches(id) on delete cascade;


-- ─────────────────────────────────────────
-- 4. ADD branch_id TO MONTHLY_REPORTS
-- ─────────────────────────────────────────
alter table monthly_reports
  add column if not exists branch_id uuid references branches(id) on delete cascade;

-- Drop old unique (month, year), replace with per-branch unique
alter table monthly_reports drop constraint if exists monthly_reports_month_year_key;
alter table monthly_reports add constraint monthly_reports_month_year_branch_id_key
  unique (month, year, branch_id);
