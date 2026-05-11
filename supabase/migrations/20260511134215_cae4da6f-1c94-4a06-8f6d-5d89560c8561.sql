
-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  starting_balance numeric not null default 1000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "own profile select" on public.profiles for select using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name) values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)));
  return new;
end; $$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- sessions
create table public.trading_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text,
  status text not null default 'active', -- active | paused | ended
  market text not null,
  strategy text not null, -- rise_fall | higher_lower | up_down
  base_stake numeric not null,
  duration_ticks int not null default 5,
  martingale_enabled boolean not null default false,
  martingale_multiplier numeric not null default 2,
  max_martingale_levels int not null default 5,
  take_profit numeric,
  stop_loss numeric,
  max_trades int,
  cooldown_seconds int not null default 0,
  starting_balance numeric not null,
  ending_balance numeric,
  total_trades int not null default 0,
  wins int not null default 0,
  losses int not null default 0,
  pnl numeric not null default 0,
  settings jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);
alter table public.trading_sessions enable row level security;
create policy "own sessions" on public.trading_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index on public.trading_sessions(user_id, started_at desc);

-- trades
create table public.trades (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.trading_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  direction text not null, -- up | down
  stake numeric not null,
  payout numeric not null default 0,
  pnl numeric not null,
  result text not null, -- win | loss
  martingale_level int not null default 0,
  entry_price numeric not null,
  exit_price numeric not null,
  duration_ticks int not null,
  created_at timestamptz not null default now()
);
alter table public.trades enable row level security;
create policy "own trades" on public.trades for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index on public.trades(session_id, created_at);
