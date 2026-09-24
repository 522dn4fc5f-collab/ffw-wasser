-- In Supabase unter SQL Editor einmal ausführen.
create table if not exists public.ffw_app_state (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.ffw_app_state enable row level security;
revoke all on table public.ffw_app_state from anon;
grant select, insert, update on table public.ffw_app_state to authenticated;
drop policy if exists "ffw authenticated read" on public.ffw_app_state;
drop policy if exists "ffw authenticated insert" on public.ffw_app_state;
drop policy if exists "ffw authenticated update" on public.ffw_app_state;
create policy "ffw authenticated read" on public.ffw_app_state for select to authenticated using (id = 'feuerwehr-wasser');
create policy "ffw authenticated insert" on public.ffw_app_state for insert to authenticated with check (id = 'feuerwehr-wasser');
create policy "ffw authenticated update" on public.ffw_app_state for update to authenticated using (id = 'feuerwehr-wasser') with check (id = 'feuerwehr-wasser');
