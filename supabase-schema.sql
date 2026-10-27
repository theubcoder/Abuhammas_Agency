-- Abu Hammas — Agency Iqama & CR Management System
-- Supabase Dashboard -> SQL Editor -> New query me ye poora script paste kar ke Run karein.
-- App sirf publishable key use karta hai (login/auth nahi hai), is liye
-- RLS policies anon (publishable) key ke liye full read/write deti hain.

-- Employees table
create table if not exists public.employees (
  id            text primary key,
  name          text,
  phone         text,
  iqama_number  text,
  kafeel_name   text,
  kafeel_phone  text,
  cr_number     text,
  company_name  text,
  expiry_date   date,
  created_at    timestamptz not null default now()
);

-- Row Level Security enable
alter table public.employees enable row level security;

-- Anon key (publishable) ke liye policies — app me auth nahi hai
drop policy if exists "employees anon select" on public.employees;
drop policy if exists "employees anon insert" on public.employees;
drop policy if exists "employees anon update" on public.employees;
drop policy if exists "employees anon delete" on public.employees;

create policy "employees anon select"
  on public.employees for select to anon using (true);

create policy "employees anon insert"
  on public.employees for insert to anon with check (true);

create policy "employees anon update"
  on public.employees for update to anon using (true) with check (true);

create policy "employees anon delete"
  on public.employees for delete to anon using (true);
