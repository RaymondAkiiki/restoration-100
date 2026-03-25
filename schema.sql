-- ============================================================
-- 100-Day Restoration Challenge — Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

create table if not exists public.days (
  id              bigint generated always as identity primary key,
  day_number      int not null unique,
  day_date        date not null,
  top3            jsonb not null default '["","",""]',
  must_not_fail   text not null default '',
  distraction     text not null default '',
  checks          jsonb not null default '{}',
  scores          jsonb not null default '{}',
  avoided         text not null default '',
  tomorrow        text not null default '',
  owner_note      text not null default '',
  partner_note    text not null default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.weeks (
  id              bigint generated always as identity primary key,
  week_number     int not null unique,
  biz_metrics     jsonb not null default '{}',
  broke_word      text not null default '',
  pattern         text not null default '',
  money_note      text not null default '',
  next3           jsonb not null default '["","",""]',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_days_updated_at on public.days;
create trigger trg_days_updated_at
  before update on public.days
  for each row execute function public.set_updated_at();

drop trigger if exists trg_weeks_updated_at on public.weeks;
create trigger trg_weeks_updated_at
  before update on public.weeks
  for each row execute function public.set_updated_at();

-- Open RLS policies (no auth — personal app)
alter table public.days  enable row level security;
alter table public.weeks enable row level security;

drop policy if exists "allow_all_days"  on public.days;
drop policy if exists "allow_all_weeks" on public.weeks;

create policy "allow_all_days"  on public.days  for all using (true) with check (true);
create policy "allow_all_weeks" on public.weeks for all using (true) with check (true);
