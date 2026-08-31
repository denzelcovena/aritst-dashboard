-- Run this in the Supabase SQL editor.

create table if not exists instagram_stats (
  id uuid primary key default gen_random_uuid(),
  followers bigint,
  captured_at timestamptz not null default now(),
  captured_date date not null default current_date,
  unique (captured_date)
);

create index if not exists idx_instagram_stats_captured on instagram_stats (captured_date);

alter table instagram_stats enable row level security;

create policy "Allow all - instagram_stats" on instagram_stats
  for all using (true) with check (true);
