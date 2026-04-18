-- =====================================================================
-- Attikid Music — songs table
-- Run this ONCE in the Supabase SQL Editor (Dashboard → SQL → New Query).
-- =====================================================================

-- Enable uuid generation (Supabase already has pgcrypto enabled by default)
create extension if not exists "pgcrypto";

-- 1) Create table if it does not exist
create table if not exists public.songs (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  file_url   text not null,
  plays      integer not null default 0,
  created_at timestamptz not null default now()
);

-- 2) If the table already existed with different columns, patch it.
alter table public.songs add column if not exists file_url   text;
alter table public.songs add column if not exists plays      integer not null default 0;
alter table public.songs add column if not exists created_at timestamptz not null default now();

-- If an older `url` column exists, copy its values into file_url (one-time backfill).
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'songs' and column_name = 'url'
  ) then
    execute 'update public.songs set file_url = url where file_url is null and url is not null';
  end if;
end$$;

-- 3) Row Level Security — allow public read, block writes for anon
alter table public.songs enable row level security;

drop policy if exists "songs are readable by everyone" on public.songs;
create policy "songs are readable by everyone"
  on public.songs for select
  using (true);

-- Writes are intentionally NOT granted to anon. The API uses the service
-- role key server-side (admin placeholder) to insert.

-- 4) Seed a few demo rows (safe to re-run — inserts only if empty)
insert into public.songs (title, file_url)
select * from (values
  ('Midnight Echoes',  'https://cdn.pixabay.com/download/audio/2022/03/15/audio_1808fbf07a.mp3'),
  ('Neon Horizons',    'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3'),
  ('Paper Planes',     'https://cdn.pixabay.com/download/audio/2023/01/18/audio_5c5e9f0b66.mp3'),
  ('Slow Burn',        'https://cdn.pixabay.com/download/audio/2022/08/04/audio_2dde668d05.mp3'),
  ('Golden Hour',      'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8e7d50a56.mp3'),
  ('Undertow',         'https://cdn.pixabay.com/download/audio/2022/10/25/audio_946f4e4c4d.mp3')
) as v(title, file_url)
where not exists (select 1 from public.songs);
