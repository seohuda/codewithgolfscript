-- ============================================================
--  Migration 007: problem images + board notices
--  - problems.image_url: 문제에 첨부할 이미지 URL (선택)
--  - posts.is_notice: 공지글 여부 (관리자만 작성)
--  - board 뷰에 is_notice / is_admin(author) 반영
--  Run this in the Supabase SQL Editor after 006_admin.sql.
-- ============================================================

alter table public.problems
  add column if not exists image_url text not null default '';

alter table public.posts
  add column if not exists is_notice boolean not null default false;

create index if not exists posts_notice_idx on public.posts(is_notice, created_at desc);

-- 작성자 관리자 여부와 공지 여부를 board 뷰에 포함.
create or replace view public.board_posts as
select
  p.id,
  p.user_id,
  u.username as author,
  u.is_admin  as author_is_admin,
  p.title,
  p.body,
  p.is_notice,
  p.created_at,
  p.updated_at,
  (select count(*) from public.comments c where c.post_id = p.id) as comment_count
from public.posts p
join public.users u on u.id = p.user_id
order by p.created_at desc;

create or replace view public.board_comments as
select
  c.id,
  c.post_id,
  c.user_id,
  u.username as author,
  u.is_admin  as author_is_admin,
  c.body,
  c.created_at
from public.comments c
join public.users u on u.id = c.user_id
order by c.created_at asc;

-- ============================================================
--  End of migration 007
-- ============================================================
