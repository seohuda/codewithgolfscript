-- ============================================================
--  Migration 005: 단계별로 풀기 (step-by-step learning path)
--  - step_group: 단계 이름 (예: "입출력과 사칙연산")
--  - step_order: 그룹 내 순서
--  Run this in the Supabase SQL Editor after 004_source_samples.sql.
-- ============================================================

alter table public.problems
  add column if not exists step_group text not null default '',
  add column if not exists step_order integer not null default 0;

create index if not exists problems_step_idx
  on public.problems(step_group, step_order);

-- ============================================================
--  End of migration 005
-- ============================================================
