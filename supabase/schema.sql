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

-- ---------------------------------------------------------------------------------------------
-- AI tutor administration (settings are encrypted by the server before they reach this table).
-- RLS is enabled with NO policies and all client roles are revoked: only the server, using the
-- service-role key, can read or write these tables. Students and even admins in the browser cannot.
-- ---------------------------------------------------------------------------------------------

create table if not exists public.ai_settings (
  id smallint primary key default 1 check (id = 1),
  enabled boolean not null default false,
  active_provider text not null default 'bedrock' check (active_provider in ('bedrock', 'azure')),
  bedrock_config text,
  azure_config text,
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_usage (
  id smallint primary key default 1 check (id = 1),
  request_count bigint not null default 0,
  error_count bigint not null default 0,
  last_used_at timestamptz,
  last_provider text
);

alter table public.ai_settings enable row level security;
alter table public.ai_usage enable row level security;
revoke all on public.ai_settings from anon, authenticated;
revoke all on public.ai_usage from anon, authenticated;

create or replace function public.ai_record_usage(p_provider text, p_ok boolean)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.ai_usage as u (id, request_count, error_count, last_used_at, last_provider)
  values (1, 1, case when p_ok then 0 else 1 end, now(), p_provider)
  on conflict (id) do update set
    request_count = u.request_count + 1,
    error_count = u.error_count + case when p_ok then 0 else 1 end,
    last_used_at = now(),
    last_provider = p_provider;
$$;

revoke all on function public.ai_record_usage(text, boolean) from public, anon, authenticated;
grant execute on function public.ai_record_usage(text, boolean) to service_role;

-- ---------------------------------------------------------------------------------------------
-- Noor chat memory: one conversation per account (the app keeps at most 60 short messages).
-- Strict RLS: owner only, no anonymous access, no delete (clearing a chat overwrites the row).
-- ---------------------------------------------------------------------------------------------

create table if not exists public.noor_conversations (
  user_id uuid primary key references auth.users (id) on delete cascade,
  messages jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  constraint noor_conversations_is_array check (jsonb_typeof(messages) = 'array'),
  constraint noor_conversations_size check (pg_column_size(messages) <= 262144)
);

alter table public.noor_conversations enable row level security;

revoke all on public.noor_conversations from anon;
grant select, insert, update on public.noor_conversations to authenticated;

drop policy if exists "noor_chat_select_own" on public.noor_conversations;
create policy "noor_chat_select_own" on public.noor_conversations
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "noor_chat_insert_own" on public.noor_conversations;
create policy "noor_chat_insert_own" on public.noor_conversations
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "noor_chat_update_own" on public.noor_conversations;
create policy "noor_chat_update_own" on public.noor_conversations
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
-- Make ONE account the admin (run once, with your own email). app_metadata can only be changed by
-- the service role / SQL editor, never by the user, so it is safe to base authorisation on.
--   update auth.users
--   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
--   where email = 'YOUR-EMAIL@example.com';
