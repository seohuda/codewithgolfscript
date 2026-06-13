-- ============================================================
--  Migration 023: account withdrawal
--  Adds withdrawal_requested_at for soft-delete flow.
--  Users request withdrawal; if they don't log in within 7 days,
--  the account is permanently deleted by a cleanup job.
--  Run in the Supabase SQL Editor after 022_submission_score.sql.
-- ============================================================

alter table public.users
  add column if not exists withdrawal_requested_at timestamptz;

create index if not exists users_withdrawal_idx
  on public.users(withdrawal_requested_at)
  where withdrawal_requested_at is not null;

-- ============================================================
--  End of migration 023
-- ============================================================
