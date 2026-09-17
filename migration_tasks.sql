-- ============================================================
-- Migration: Add Tasks Table for To-Do & Telegram Bot Integration
-- Run this in your Supabase SQL Editor if you already ran schema.sql
-- ============================================================

create table if not exists public.tasks (
  id              bigint generated always as identity primary key,
  quarter_id      bigint references public.quarters(id) on delete cascade,
  title           text not null,
  urgency         text not null default 'medium' check (urgency in ('urgent', 'high', 'medium', 'low')),
  arena           text default null,
  status          text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'cancelled')),
  due_date        date default null,
  remind_at       timestamptz default null,
  reminder_sent   boolean not null default false,
  notes           text not null default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

drop trigger if exists trg_tasks_updated_at on public.tasks;
create trigger trg_tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

alter table public.tasks enable row level security;
drop policy if exists "allow_all_tasks" on public.tasks;
create policy "allow_all_tasks" on public.tasks for all using (true) with check (true);
