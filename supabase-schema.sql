create table if not exists public.cashflow_user_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{"transactions":[],"receivables":[],"payables":[]}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.cashflow_user_data enable row level security;

drop policy if exists "Users can read own cashflow data" on public.cashflow_user_data;
create policy "Users can read own cashflow data"
on public.cashflow_user_data
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own cashflow data" on public.cashflow_user_data;
create policy "Users can insert own cashflow data"
on public.cashflow_user_data
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own cashflow data" on public.cashflow_user_data;
create policy "Users can update own cashflow data"
on public.cashflow_user_data
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own cashflow data" on public.cashflow_user_data;
create policy "Users can delete own cashflow data"
on public.cashflow_user_data
for delete
to authenticated
using (auth.uid() = user_id);
