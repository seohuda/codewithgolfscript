-- ============================================================
--  Migration 020: subtask scoring (partial points)
--  - test_cases.subtask: which subtask a case belongs to (0 = none)
--  - problems.subtasks: JSON array of subtask definitions, e.g.
--      [{"no":1,"points":10,"desc":"N=1"}, ...]
--  Problems with an empty subtasks array keep the old behaviour
--  (all cases must pass for AC; no partial score).
--  Run in the Supabase SQL Editor after 019_profile_follows.sql.
-- ============================================================

alter table public.test_cases
  add column if not exists subtask integer not null default 0;

alter table public.problems
  add column if not exists subtasks jsonb not null default '[]'::jsonb;

-- ============================================================
--  End of migration 020
-- ============================================================
