-- ============================================================
--  Migration 006: admin accounts
--  - users.is_admin: 관리자 플래그
--  - leaderboard 뷰를 갱신하여 관리자의 제출을 순위에서 제외
--  Run this in the Supabase SQL Editor after 005_steps.sql.
-- ============================================================

alter table public.users
  add column if not exists is_admin boolean not null default false;

-- 리더보드: 관리자(is_admin = true)는 순위에서 제외한다.
create or replace view public.leaderboard as
with accepted as (
  select
    s.id,
    s.user_id,
    s.problem_id,
    s.bytes,
    s.created_at,
    row_number() over (
      partition by s.user_id, s.problem_id
      order by s.bytes asc, s.created_at asc
    ) as user_best_rank
  from public.submissions s
  join public.users u on u.id = s.user_id
  where s.verdict = 'AC'
    and u.is_admin = false
)
select
  a.problem_id,
  a.user_id,
  u.username,
  a.bytes,
  a.created_at,
  rank() over (
    partition by a.problem_id
    order by a.bytes asc, a.created_at asc
  ) as rank
from accepted a
join public.users u on u.id = a.user_id
where a.user_best_rank = 1
order by a.problem_id asc, a.bytes asc, a.created_at asc;

-- ============================================================
--  End of migration 006
-- ============================================================
