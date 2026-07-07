-- ============================================================================
-- OREoS 0008_member_directory — expose co-members' identities to a workspace.
-- profiles RLS is self-only (PII protection), so a plain join can't show
-- teammates' names/emails. This SECURITY DEFINER function returns them, but
-- ONLY to callers who are themselves members of the workspace. This is a
-- deliberate, minimal widening: co-workspace members may see each other's
-- name/email, which the Team page requires. Documented in SECURITY_REVIEW.md.
-- ============================================================================

create or replace function public.list_workspace_members(ws uuid)
returns table (user_id uuid, name text, email text, role team_role, added_at timestamptz)
language sql
security definer
stable
set search_path = ''
as $$
  select m.user_id, p.name, p.email, m.role, m.added_at
  from public.workspace_members m
  join public.profiles p on p.id = m.user_id
  where m.workspace_id = ws
    and private.is_member(ws)   -- caller must belong to this workspace
  order by m.added_at;
$$;
