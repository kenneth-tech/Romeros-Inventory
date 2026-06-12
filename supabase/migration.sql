-- ============================================================
-- Romeros Inventory — Database Migration
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ─────────────────────────────────────────
-- 1. PARTS
-- ─────────────────────────────────────────
create table if not exists parts (
  id               uuid primary key default gen_random_uuid(),
  part_number      text not null unique,
  product_name     text not null,
  category         text not null default '',
  vehicle_compatibility text not null default '',
  stock            integer not null default 0,
  min_stock        integer not null default 1,
  cost_price       numeric(10,2) not null default 0,
  selling_price    numeric(10,2) not null default 0,
  supplier         text not null default '',
  location         text not null default '',
  created_at       timestamptz not null default now()
);

alter table parts enable row level security;

-- Admin: full access
create policy "Admin full access on parts"
  on parts for all
  using (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');

-- Staff: full CRUD
create policy "Staff read parts"
  on parts for select
  using (auth.role() = 'authenticated');

create policy "Staff insert parts"
  on parts for insert
  with check (auth.role() = 'authenticated');

create policy "Staff update parts"
  on parts for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Staff delete parts"
  on parts for delete
  using (auth.role() = 'authenticated');

grant select, insert, update, delete on table public.parts to authenticated;
grant select on table public.parts to anon;


-- ─────────────────────────────────────────
-- 2. STOCK MOVEMENTS
-- ─────────────────────────────────────────
create table if not exists stock_movements (
  id         uuid primary key default gen_random_uuid(),
  part_id    uuid not null references parts(id) on delete cascade,
  type       text not null check (type in ('IN', 'OUT')),
  quantity   integer not null check (quantity > 0),
  supplier   text not null default '',
  reference  text not null default '',
  remarks    text not null default '',
  date       date not null default current_date,
  created_at timestamptz not null default now()
);

alter table stock_movements enable row level security;

create policy "Admin full access on stock_movements"
  on stock_movements for all
  using (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');

create policy "Staff read stock_movements"
  on stock_movements for select
  using (auth.role() = 'authenticated');

create policy "Staff insert stock_movements"
  on stock_movements for insert
  with check (auth.role() = 'authenticated');

grant select, insert on table public.stock_movements to authenticated;
grant select on table public.stock_movements to anon;


-- ─────────────────────────────────────────
-- 3. MONTHLY REPORTS
-- ─────────────────────────────────────────
create table if not exists monthly_reports (
  id           uuid primary key default gen_random_uuid(),
  month        smallint not null check (month between 1 and 12),
  year         smallint not null check (year >= 2000),
  generated_by uuid references auth.users(id) on delete set null,
  file_url     text,
  created_at   timestamptz not null default now(),
  unique (month, year)
);

alter table monthly_reports enable row level security;

create policy "Admin full access on monthly_reports"
  on monthly_reports for all
  using (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');

create policy "Staff read monthly_reports"
  on monthly_reports for select
  using (auth.role() = 'authenticated');

grant select, insert on table public.monthly_reports to authenticated;
grant select on table public.monthly_reports to anon;


-- ─────────────────────────────────────────
-- 4. SERVICE RECORDS
-- ─────────────────────────────────────────
create table if not exists service_records (
  id             uuid primary key default gen_random_uuid(),
  customer_name  text not null,
  vehicle_model  text not null default '',
  plate_number   text not null default '',
  service_type   text not null default '',
  date           date not null default current_date,
  created_at     timestamptz not null default now()
);

alter table service_records enable row level security;

create policy "Admin full access on service_records"
  on service_records for all
  using (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');

create policy "Staff read service_records"
  on service_records for select
  using (auth.role() = 'authenticated');

create policy "Staff insert service_records"
  on service_records for insert
  with check (auth.role() = 'authenticated');

grant select, insert on table public.service_records to authenticated;
grant select on table public.service_records to anon;


-- ─────────────────────────────────────────
-- 5. AUTO-UPDATE PARTS.STOCK ON MOVEMENT
--    Trigger keeps stock in sync automatically
-- ─────────────────────────────────────────
create or replace function update_part_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.type = 'IN' then
    update parts set stock = stock + NEW.quantity where id = NEW.part_id;
  elsif NEW.type = 'OUT' then
    update parts set stock = stock - NEW.quantity where id = NEW.part_id;
  end if;
  return NEW;
end;
$$;

create trigger trg_update_stock
  after insert on stock_movements
  for each row execute function update_part_stock();


-- ─────────────────────────────────────────
-- 6. PROFILES (role storage)
--    Stores admin/staff role per user safely in app_metadata via this table
-- ─────────────────────────────────────────
create table if not exists profiles (
  id      uuid primary key references auth.users(id) on delete cascade,
  role    text not null default 'staff' check (role in ('admin', 'staff')),
  name    text not null default ''
);

alter table profiles enable row level security;

create policy "Users read own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Admin read all profiles"
  on profiles for select
  using (auth.jwt() ->> 'role' = 'admin');

create policy "Admin update profiles"
  on profiles for update
  using (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = private
as $$
begin
  insert into public.profiles (id, role, name)
  values (NEW.id, 'staff', coalesce(NEW.raw_user_meta_data->>'full_name', ''));
  return NEW;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
