-- =====================================================================
-- Attikid Music — Session 4 migrations
-- Run this ONCE in the Supabase SQL Editor.
-- Idempotent — safe to re-run.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- likes  (anti-spam: unique(song_id, session_id))
-- ---------------------------------------------------------------------
create table if not exists public.likes (
  id          uuid primary key default gen_random_uuid(),
  song_id     uuid not null references public.songs(id) on delete cascade,
  session_id  text not null,
  created_at  timestamptz not null default now(),
  constraint  likes_unique_per_session unique (song_id, session_id)
);

create index if not exists likes_song_id_idx    on public.likes (song_id);
create index if not exists likes_session_id_idx on public.likes (session_id);

alter table public.likes enable row level security;

-- Public can read counts, API (service role) handles writes
drop policy if exists "likes readable" on public.likes;
create policy "likes readable"
  on public.likes for select using (true);

-- ---------------------------------------------------------------------
-- comments
-- ---------------------------------------------------------------------
create table if not exists public.comments (
  id          uuid primary key default gen_random_uuid(),
  song_id     uuid not null references public.songs(id) on delete cascade,
  session_id  text,
  author      text,
  body        text not null,
  created_at  timestamptz not null default now()
);

create index if not exists comments_song_id_idx on public.comments (song_id);

alter table public.comments enable row level security;
drop policy if exists "comments readable" on public.comments;
create policy "comments readable"
  on public.comments for select using (true);

-- ---------------------------------------------------------------------
-- Seed a couple of demo comments (only if empty)
-- ---------------------------------------------------------------------
insert into public.comments (song_id, author, body)
select s.id, 'demo_fan', 'Love this one 🔥'
from public.songs s
where s.title = 'Neon Horizons'
  and not exists (select 1 from public.comments);

insert into public.comments (song_id, author, body)
select s.id, 'random_guest', 'My new focus track.'
from public.songs s
where s.title = 'Focus Deep'
  and not exists (select 1 from public.comments where author = 'random_guest');
