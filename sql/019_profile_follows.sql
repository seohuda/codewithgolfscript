-- ============================================================
--  Migration 019: profile customization + follows
--  - users.bio: short self-introduction
--  - users.featured_badge: id of the badge shown on the profile
--  - follows: follower → following relationships
--  Run in the Supabase SQL Editor after 018_account_controls.sql.
-- ============================================================

alter table public.users
  add column if not exists bio text not null default '',
  add column if not exists featured_badge text;

create table if not exists public.follows (
  follower_id  uuid not null references public.users(id) on delete cascade,
  following_id uuid not null references public.users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create index if not exists follows_follower_idx on public.follows(follower_id);
create index if not exists follows_following_idx on public.follows(following_id);

alter table public.follows enable row level security;
-- Reads/writes go through the server (service_role), which bypasses RLS.

-- ============================================================
--  End of migration 019
-- ============================================================
