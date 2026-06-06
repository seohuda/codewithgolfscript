-- ============================================================
--  Migration 002: user accounts
--  Adds password-based authentication to the users table.
--  Run this in the Supabase SQL Editor after schema.sql.
-- ============================================================

-- Password hash (scrypt). Nullable so legacy seed users remain valid.
alter table public.users
  add column if not exists password_hash text;

-- Case-insensitive uniqueness is enforced at the application layer;
-- the existing UNIQUE(username) constraint covers exact duplicates.

-- The anon client must NOT be able to read password hashes.
-- Column-level privilege: revoke SELECT on password_hash from the
-- public-facing roles. They keep reading the other columns (id,
-- username, created_at). The server uses service_role and bypasses this.
revoke select (password_hash) on public.users from anon;
revoke select (password_hash) on public.users from authenticated;

-- ============================================================
--  End of migration 002
-- ============================================================
