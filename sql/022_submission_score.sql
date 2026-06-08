-- ============================================================
--  Migration 022: store subtask score on submissions
--  Lets the profile show "solved with partial score" without
--  re-judging. NULL = problem has no subtasks (score not applicable).
--  Run in the Supabase SQL Editor after 021_deunggyo_problem.sql.
-- ============================================================

alter table public.submissions
  add column if not exists score integer,
  add column if not exists max_score integer;

-- ============================================================
--  End of migration 022
-- ============================================================
