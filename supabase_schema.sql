-- Enable required extensions (uuid via gen_random_uuid)
create extension if not exists pgcrypto;

-- Fuel records table
create table if not exists public.fuel_records (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  amount numeric(10,2) not null,
  cost integer not null,
  mileage numeric(12,1) not null,
  station text not null,
  created_at timestamp with time zone default now()
);

-- Row Level Security
alter table public.fuel_records enable row level security;

-- WARNING: For demo/dev only. Allows anonymous read/write.
-- Restrict in production to authenticated users.
create policy "allow anon read" on public.fuel_records for select using (true);
create policy "allow anon insert" on public.fuel_records for insert with check (true);
create policy "allow anon delete" on public.fuel_records for delete using (true);
