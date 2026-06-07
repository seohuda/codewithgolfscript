-- ============================================================
--  Migration 017: login attempt lockout
--  Tracks consecutive failed login attempts. After 5 failures the
--  account is locked for a cooldown window and a password-reset email
--  is sent automatically.
--  Run in the Supabase SQL Editor after 016_grandfather_verified.sql.
-- ============================================================

alter table public.users
  add column if not exists failed_login_count integer not null default 0,
  add column if not exists lockout_until timestamptz;

-- ============================================================
--  End of migration 017
-- ============================================================
