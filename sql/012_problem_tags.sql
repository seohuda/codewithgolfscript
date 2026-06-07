-- ============================================================
--  Migration 012: problem tags
--  Run in the Supabase SQL Editor after 011_reports_votes.sql.
-- ============================================================

-- Tags stored directly on the problem as a text array (e.g. {수학,문자열}).
alter table public.problems
  add column if not exists tags text[] not null default '{}';

-- GIN index for fast "contains tag" filtering.
create index if not exists problems_tags_idx on public.problems using gin (tags);

-- ============================================================
--  End of migration 012
-- ============================================================
