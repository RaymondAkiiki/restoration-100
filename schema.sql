-- ============================================================
-- Quarterly Restoration System - Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

create table if not exists public.quarters (
  id              bigint generated always as identity primary key,
  label           text not null,
  theme           text not null default '',
  start_date      date not null,
  end_date        date not null,
  status          text not null default 'active' check (status in ('draft', 'active', 'archived')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.days (
  id              bigint generated always as identity primary key,
  quarter_id      bigint references public.quarters(id) on delete cascade,
  day_number      int not null,
  day_date        date not null,
  top3            jsonb not null default '["","",""]',
  top3_goal_ids   jsonb not null default '["","",""]',
  must_not_fail   text not null default '',
  distraction     text not null default '',
  checks          jsonb not null default '{}',
  scores          jsonb not null default '{}',
  avoided         text not null default '',
  moved           text not null default '',
  tomorrow        text not null default '',
  owner_note      text not null default '',
  partner_note    text not null default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.weeks (
  id              bigint generated always as identity primary key,
  quarter_id      bigint references public.quarters(id) on delete cascade,
  week_number     int not null,
  biz_metrics     jsonb not null default '{}',
  kept_word       text not null default '',
  broke_word      text not null default '',
  pattern         text not null default '',
  money_note      text not null default '',
  goal_progress   text not null default '',
  next3           jsonb not null default '["","",""]',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.quarter_goals (
  id              bigint generated always as identity primary key,
  quarter_id      bigint not null references public.quarters(id) on delete cascade,
  arena           text not null,
  title           text not null,
  target_value    text not null default '',
  current_value   text not null default '',
  status          text not null default 'active' check (status in ('active', 'achieved', 'paused', 'dropped')),
  notes           text not null default '',
  sort_order      int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.quarter_reviews (
  id              bigint generated always as identity primary key,
  quarter_id      bigint not null unique references public.quarters(id) on delete cascade,
  wins            text not null default '',
  misses          text not null default '',
  patterns        text not null default '',
  lessons         text not null default '',
  rollover        text not null default '',
  next_theme      text not null default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Migration support for older 100-day installations.
alter table public.days add column if not exists quarter_id bigint references public.quarters(id) on delete cascade;
alter table public.days add column if not exists top3_goal_ids jsonb not null default '["","",""]';
alter table public.days add column if not exists moved text not null default '';

alter table public.weeks add column if not exists quarter_id bigint references public.quarters(id) on delete cascade;
alter table public.weeks add column if not exists kept_word text not null default '';
alter table public.weeks add column if not exists goal_progress text not null default '';

insert into public.quarters (label, theme, start_date, end_date, status)
select
  '2026 Q3',
  'Become a disciplined, emotionally stable, revenue-generating operator.',
  date '2026-07-01',
  date '2026-09-30',
  'active'
where not exists (select 1 from public.quarters where status = 'active');

update public.days
set quarter_id = (select id from public.quarters where status = 'active' order by start_date desc limit 1)
where quarter_id is null;

update public.weeks
set quarter_id = (select id from public.quarters where status = 'active' order by start_date desc limit 1)
where quarter_id is null;

insert into public.quarter_goals (quarter_id, arena, title, target_value, sort_order)
select q.id, g.arena, g.title, g.target_value, g.sort_order
from (select id from public.quarters where status = 'active' order by start_date desc limit 1) q
cross join (values
  ('discipline', 'Wake on time 5 days each week', '5 wake-ups/week', 0),
  ('discipline', 'Exercise 4 times each week', '4 sessions/week', 1),
  ('discipline', 'Complete every weekly review', '13 reviews', 2),
  ('revenue', 'Grow Threalty recurring revenue', 'Set monthly UGX target', 3),
  ('revenue', 'Track every expense the same day', 'Daily expense record', 4),
  ('sales', 'Contact 20 landlords each week', '20 contacts/week', 5),
  ('sales', 'Send 5 proposals each week', '5 proposals/week', 6),
  ('sales', 'Follow up every active prospect weekly', '100% follow-up', 7),
  ('emotional', 'Recover from setbacks within 24 hours', 'Same-day reset', 8),
  ('relationships', 'Have one meaningful parent conversation weekly', '1/week', 9),
  ('relationships', 'Have one meaningful partner conversation weekly', '1/week', 10)
) as g(arena, title, target_value, sort_order)
where not exists (
  select 1
  from public.quarter_goals existing
  where existing.quarter_id = q.id
);

alter table public.days drop constraint if exists days_day_number_key;
alter table public.weeks drop constraint if exists weeks_week_number_key;
alter table public.days drop constraint if exists days_quarter_day_unique;
alter table public.weeks drop constraint if exists weeks_quarter_week_unique;

alter table public.days alter column quarter_id set not null;
alter table public.weeks alter column quarter_id set not null;

alter table public.days add constraint days_quarter_day_unique unique (quarter_id, day_number);
alter table public.weeks add constraint weeks_quarter_week_unique unique (quarter_id, week_number);

create unique index if not exists quarters_one_active
  on public.quarters ((status))
  where status = 'active';

-- auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_quarters_updated_at on public.quarters;
create trigger trg_quarters_updated_at
  before update on public.quarters
  for each row execute function public.set_updated_at();

drop trigger if exists trg_days_updated_at on public.days;
create trigger trg_days_updated_at
  before update on public.days
  for each row execute function public.set_updated_at();

drop trigger if exists trg_weeks_updated_at on public.weeks;
create trigger trg_weeks_updated_at
  before update on public.weeks
  for each row execute function public.set_updated_at();

drop trigger if exists trg_quarter_goals_updated_at on public.quarter_goals;
create trigger trg_quarter_goals_updated_at
  before update on public.quarter_goals
  for each row execute function public.set_updated_at();

drop trigger if exists trg_quarter_reviews_updated_at on public.quarter_reviews;
create trigger trg_quarter_reviews_updated_at
  before update on public.quarter_reviews
  for each row execute function public.set_updated_at();

-- Open RLS policies (no auth - personal app)
alter table public.quarters enable row level security;
alter table public.days enable row level security;
alter table public.weeks enable row level security;
alter table public.quarter_goals enable row level security;
alter table public.quarter_reviews enable row level security;

drop policy if exists "allow_all_quarters" on public.quarters;
drop policy if exists "allow_all_days" on public.days;
drop policy if exists "allow_all_weeks" on public.weeks;
drop policy if exists "allow_all_quarter_goals" on public.quarter_goals;
drop policy if exists "allow_all_quarter_reviews" on public.quarter_reviews;

create policy "allow_all_quarters" on public.quarters for all using (true) with check (true);
create policy "allow_all_days" on public.days for all using (true) with check (true);
create policy "allow_all_weeks" on public.weeks for all using (true) with check (true);
create policy "allow_all_quarter_goals" on public.quarter_goals for all using (true) with check (true);
create policy "allow_all_quarter_reviews" on public.quarter_reviews for all using (true) with check (true);
