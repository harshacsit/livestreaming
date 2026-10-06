-- =====================================================================
-- Live Score Projection - Supabase schema
-- Run this whole file once in: Supabase Dashboard > SQL Editor > New query
-- Safe to re-run (uses IF NOT EXISTS where possible).
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------- updated_at helper ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------- PLAYERS ----------
-- If you already have a players table, DO NOT run this blindly.
-- See the "existing table" note in the setup steps first.
create table if not exists public.players (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  photo_url   text,
  photo_path  text,                       -- storage path, used to delete old photos
  country     text,
  ranking     integer,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists players_name_idx on public.players (lower(name));

-- ---------- MATCHES ----------
create table if not exists public.matches (
  id            uuid primary key default gen_random_uuid(),
  event_name    text not null default '',
  stage         text not null default '',
  status        text not null default 'SCHEDULED'
                check (status in ('SCHEDULED','LIVE','PAUSED','FINISHED')),
  player1_id    uuid not null references public.players(id) on delete restrict,
  player2_id    uuid not null references public.players(id) on delete restrict,
  current_set   integer not null default 1,
  player1_score integer not null default 0 check (player1_score >= 0),
  player2_score integer not null default 0 check (player2_score >= 0),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (player1_id <> player2_id)
);
create index if not exists matches_status_idx on public.matches (status);
-- Only ONE match can be LIVE at any time (enforced by the database itself)
create unique index if not exists only_one_live_match
  on public.matches ((status)) where status = 'LIVE';

-- ---------- MATCH_STATISTICS ----------
create table if not exists public.match_statistics (
  id                       uuid primary key default gen_random_uuid(),
  match_id                 uuid not null references public.matches(id) on delete cascade,
  player_id                uuid not null references public.players(id) on delete cascade,
  forehand_winners         integer not null default 0 check (forehand_winners >= 0),
  backhand_winners         integer not null default 0 check (backhand_winners >= 0),
  forehand_unforced_errors integer not null default 0 check (forehand_unforced_errors >= 0),
  backhand_unforced_errors integer not null default 0 check (backhand_unforced_errors >= 0),
  forced_errors            integer not null default 0 check (forced_errors >= 0),
  net_points               integer not null default 0 check (net_points >= 0),
  baseline_points          integer not null default 0 check (baseline_points >= 0),
  under_9_shots            integer not null default 0 check (under_9_shots >= 0),
  over_9_shots             integer not null default 0 check (over_9_shots >= 0),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (match_id, player_id)
);

-- ---------- MATCH_EVENTS ----------
create table if not exists public.match_events (
  id          uuid primary key default gen_random_uuid(),
  match_id    uuid not null references public.matches(id) on delete cascade,
  player_id   uuid not null references public.players(id) on delete cascade,
  event_type  text not null,              -- 'POINT' or a statistics column name
  value       integer not null,           -- +1 / -1 (amount actually applied)
  reversed    boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists match_events_match_idx
  on public.match_events (match_id, created_at desc);

-- ---------- updated_at triggers ----------
drop trigger if exists trg_players_updated on public.players;
create trigger trg_players_updated before update on public.players
  for each row execute function public.set_updated_at();
drop trigger if exists trg_matches_updated on public.matches;
create trigger trg_matches_updated before update on public.matches
  for each row execute function public.set_updated_at();
drop trigger if exists trg_stats_updated on public.match_statistics;
create trigger trg_stats_updated before update on public.match_statistics
  for each row execute function public.set_updated_at();

-- =====================================================================
-- RPC FUNCTIONS (atomic, so rapid clicks never lose points)
-- =====================================================================

-- Internal helper: apply +/- delta to the score or one statistic.
-- Returns the amount really applied (0 if it would go below zero).
create or replace function public.apply_delta(
  p_match uuid, p_player uuid, p_type text, p_delta integer
) returns integer
language plpgsql security invoker as $$
declare
  v_old integer; v_new integer;
  v_m public.matches;
  allowed text[] := array[
    'forehand_winners','backhand_winners','forehand_unforced_errors',
    'backhand_unforced_errors','forced_errors','net_points',
    'baseline_points','under_9_shots','over_9_shots'];
begin
  select * into v_m from public.matches where id = p_match for update;
  if not found then raise exception 'match not found'; end if;
  if p_player not in (v_m.player1_id, v_m.player2_id) then
    raise exception 'player is not in this match';
  end if;

  if p_type = 'POINT' then
    if p_player = v_m.player1_id then
      v_old := v_m.player1_score; v_new := greatest(0, v_old + p_delta);
      update public.matches set player1_score = v_new where id = p_match;
    else
      v_old := v_m.player2_score; v_new := greatest(0, v_old + p_delta);
      update public.matches set player2_score = v_new where id = p_match;
    end if;
  elsif p_type = any(allowed) then
    insert into public.match_statistics (match_id, player_id)
      values (p_match, p_player) on conflict (match_id, player_id) do nothing;
    execute format('select %I from public.match_statistics where match_id=$1 and player_id=$2', p_type)
      into v_old using p_match, p_player;
    v_new := greatest(0, v_old + p_delta);
    execute format('update public.match_statistics set %I=$3 where match_id=$1 and player_id=$2', p_type)
      using p_match, p_player, v_new;
  else
    raise exception 'unknown event type';
  end if;
  return v_new - v_old;
end $$;

-- Public entry point used by the admin buttons.
create or replace function public.record_action(
  p_match uuid, p_player uuid, p_type text, p_delta integer
) returns void
language plpgsql security invoker as $$
declare v_applied integer;
begin
  if p_delta not in (-1, 1) then raise exception 'delta must be +1 or -1'; end if;
  v_applied := public.apply_delta(p_match, p_player, p_type, p_delta);
  if v_applied <> 0 then
    insert into public.match_events (match_id, player_id, event_type, value)
    values (p_match, p_player, p_type, v_applied);
  end if;
end $$;

-- Undo the most recent action that has not been reversed yet.
create or replace function public.undo_last_action(p_match uuid)
returns void
language plpgsql security invoker as $$
declare v_e public.match_events;
begin
  select * into v_e from public.match_events
   where match_id = p_match and reversed = false
   order by created_at desc, id desc limit 1 for update;
  if not found then return; end if;
  perform public.apply_delta(p_match, v_e.player_id, v_e.event_type, -v_e.value);
  update public.match_events set reversed = true where id = v_e.id;
end $$;

-- Change match status. Starting a match pauses any other LIVE match first.
create or replace function public.set_match_status(p_match uuid, p_status text)
returns void
language plpgsql security invoker as $$
begin
  if p_status not in ('SCHEDULED','LIVE','PAUSED','FINISHED') then
    raise exception 'invalid status';
  end if;
  if p_status = 'LIVE' then
    update public.matches set status = 'PAUSED'
     where status = 'LIVE' and id <> p_match;
  end if;
  update public.matches set status = p_status where id = p_match;
end $$;

-- Reset scores/statistics/events of a match.
create or replace function public.reset_match(p_match uuid)
returns void
language plpgsql security invoker as $$
begin
  update public.matches set player1_score = 0, player2_score = 0,
         current_set = 1, status = 'SCHEDULED' where id = p_match;
  delete from public.match_statistics where match_id = p_match;
  delete from public.match_events where match_id = p_match;
end $$;

revoke execute on function public.apply_delta(uuid,uuid,text,integer) from public, anon;
revoke execute on function public.record_action(uuid,uuid,text,integer) from public, anon;
revoke execute on function public.undo_last_action(uuid) from public, anon;
revoke execute on function public.set_match_status(uuid,text) from public, anon;
revoke execute on function public.reset_match(uuid) from public, anon;
grant execute on function public.apply_delta(uuid,uuid,text,integer) to authenticated;
grant execute on function public.record_action(uuid,uuid,text,integer) to authenticated;
grant execute on function public.undo_last_action(uuid) to authenticated;
grant execute on function public.set_match_status(uuid,text) to authenticated;
grant execute on function public.reset_match(uuid) to authenticated;

-- =====================================================================
-- ROW LEVEL SECURITY
-- Public (projection): read-only.  Logged-in admin: full access.
-- =====================================================================
alter table public.players          enable row level security;
alter table public.matches          enable row level security;
alter table public.match_statistics enable row level security;
alter table public.match_events     enable row level security;

do $$
declare t text;
begin
  foreach t in array array['players','matches','match_statistics','match_events'] loop
    execute format('drop policy if exists "public read" on public.%I', t);
    execute format('drop policy if exists "admin write" on public.%I', t);
    execute format('create policy "public read" on public.%I for select to anon, authenticated using (true)', t);
    execute format('create policy "admin write" on public.%I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- =====================================================================
-- REALTIME (tables the projection listens to)
-- =====================================================================
do $$
declare t text;
begin
  foreach t in array array['matches','match_statistics','players'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
-- Needed so UPDATE events carry full rows
alter table public.matches          replica identity full;
alter table public.match_statistics replica identity full;
alter table public.players          replica identity full;

-- =====================================================================
-- STORAGE: public bucket "player-photos"
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('player-photos', 'player-photos', true)
on conflict (id) do nothing;

drop policy if exists "photos public read"  on storage.objects;
drop policy if exists "photos admin insert" on storage.objects;
drop policy if exists "photos admin update" on storage.objects;
drop policy if exists "photos admin delete" on storage.objects;
create policy "photos public read"  on storage.objects for select
  to anon, authenticated using (bucket_id = 'player-photos');
create policy "photos admin insert" on storage.objects for insert
  to authenticated with check (bucket_id = 'player-photos');
create policy "photos admin update" on storage.objects for update
  to authenticated using (bucket_id = 'player-photos');
create policy "photos admin delete" on storage.objects for delete
  to authenticated using (bucket_id = 'player-photos');
