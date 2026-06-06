-- ============================================================
--  Migration 004: problem source + example I/O
--  - source: 문제 출처/유래 (예: "Project Euler #1")
--  - sample_input / sample_output: 문제 설명용 예제 입출력
--    (채점용 test_cases와는 별개의 값)
--  Run this in the Supabase SQL Editor after 003_tiers_board.sql.
-- ============================================================

alter table public.problems
  add column if not exists source text not null default '',
  add column if not exists sample_input text not null default '',
  add column if not exists sample_output text not null default '';

-- ============================================================
--  End of migration 004
-- ============================================================
