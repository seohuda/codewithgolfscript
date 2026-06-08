-- ============================================================
--  Migration 018: account abuse controls
--  - signup_ip: source IP recorded at signup (for per-IP limits)
--  - suspended: admin-applied account suspension (separate from the
--    automatic rate-limit ban in banned_until)
--  - suspended_reason / suspended_at: audit context
--  Run in the Supabase SQL Editor after 017_login_lockout.sql.
-- ============================================================

alter table public.users
  add column if not exists signup_ip text,
  add column if not exists suspended boolean not null default false,
  add column if not exists suspended_reason text,
  add column if not exists suspended_at timestamptz;

create index if not exists users_signup_ip_idx on public.users(signup_ip);

-- Helps the unverified-account cleanup find stale rows quickly.
create index if not exists users_unverified_idx
  on public.users(email_verified, created_at);

-- ============================================================
--  End of migration 018
-- ============================================================
