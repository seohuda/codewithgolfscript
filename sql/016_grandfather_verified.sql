-- ============================================================
--  Migration 016: enforce email verification
--  Existing accounts (created before verification was enforced)
--  are grandfathered in as verified so they are not locked out.
--  New signups must verify before they can log in.
--  Run in the Supabase SQL Editor after 015_admin_audit_log.sql.
-- ============================================================

-- Grandfather all current users as verified.
update public.users
set email_verified = true
where email_verified = false;

-- ============================================================
--  End of migration 016
-- ============================================================
