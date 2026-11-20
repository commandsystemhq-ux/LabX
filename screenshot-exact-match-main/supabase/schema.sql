-- LabX learner progress. Run once in Supabase > SQL Editor.
-- One row per account; the app stores its validated ProgressState JSON in `state`.

create table if not exists public.user_progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now(),
  constraint user_progress_state_is_object check (jsonb_typeof(state) = 'object'),
  constraint user_progress_state_size check (pg_column_size(state) <= 65536)
);

alter table public.user_progress enable row level security;

-- Anonymous visitors get no access at all; signed-in users only see and write their own row.
revoke all on public.user_progress from anon;
grant select, insert, update on public.user_progress to authenticated;

drop policy if exists "progress_select_own" on public.user_progress;
create policy "progress_select_own" on public.user_progress
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "progress_insert_own" on public.user_progress;
create policy "progress_insert_own" on public.user_progress
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "progress_update_own" on public.user_progress;
create policy "progress_update_own" on public.user_progress
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
