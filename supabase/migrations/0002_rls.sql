-- ============================================================================
-- OREoS 0002_rls — role helpers + Row-Level Security policies (default deny)
-- Helpers live in a private schema (not exposed over PostgREST); SECURITY
-- DEFINER breaks the RLS recursion that would occur if a workspace_members
-- policy queried workspace_members. See docs/SCHEMA.md §3.
-- ============================================================================

create schema if not exists private;

create or replace function private.member_role(ws uuid)
returns team_role
set search_path = ''
language sql security definer stable
as $$
  select role from public.workspace_members
  where workspace_id = ws and user_id = (select auth.uid())
$$;

create or replace function private.is_member(ws uuid) returns boolean
  language sql security definer stable set search_path = ''
  as $$ select private.member_role(ws) is not null $$;

create or replace function private.is_editor(ws uuid) returns boolean
  language sql security definer stable set search_path = ''
  as $$ select private.member_role(ws) in ('owner','editor') $$;

create or replace function private.is_owner(ws uuid) returns boolean
  language sql security definer stable set search_path = ''
  as $$ select private.member_role(ws) = 'owner' $$;

-- enable RLS everywhere (default deny once enabled, before any policy grants)
alter table profiles          enable row level security;
alter table workspaces        enable row level security;
alter table workspace_members enable row level security;
alter table brands            enable row level security;
alter table products          enable row level security;
alter table campaigns         enable row level security;
alter table campaign_ideas    enable row level security;
alter table assets            enable row level security;
alter table generation_jobs   enable row level security;
alter table notifications     enable row level security;

-- ── profiles: strictly self (email immutability enforced by trigger 0003) ─────
create policy "own profile read"   on profiles for select using (id = (select auth.uid()));
create policy "own profile update" on profiles for update using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
-- INSERT happens via the handle_new_user trigger (security definer) only.

-- ── workspaces: member read; owner update (plan/credits protected by trigger) ─
create policy "member read ws"  on workspaces for select using (private.is_member(id));
create policy "owner update ws" on workspaces for update using (private.is_owner(id))
  with check (private.is_owner(id));
-- INSERT/DELETE are not client operations in v1 (bootstrap trigger creates the
-- personal workspace; deletion is a support/console action).

-- ── members: member read; owner manages others (never self, never the ws owner)
create policy "member read members" on workspace_members for select
  using (private.is_member(workspace_id));
create policy "owner add member" on workspace_members for insert
  with check (private.is_owner(workspace_id)
              and user_id <> (select auth.uid()) and role <> 'owner');
create policy "owner change member" on workspace_members for update
  using (private.is_owner(workspace_id) and user_id <> (select auth.uid())
         and user_id <> (select owner_id from workspaces w where w.id = workspace_id))
  with check (role <> 'owner');
create policy "owner remove member" on workspace_members for delete
  using (private.is_owner(workspace_id) and user_id <> (select auth.uid())
         and user_id <> (select owner_id from workspaces w where w.id = workspace_id));

-- ── brands: member read, editor write ─────────────────────────────────────────
create policy "member read brands"  on brands for select using (private.is_member(workspace_id));
create policy "editor write brands" on brands for all using (private.is_editor(workspace_id))
  with check (private.is_editor(workspace_id));

-- ── products: member read, editor write (dossier/status locked by trigger) ────
create policy "member read products"  on products for select using (private.is_member(workspace_id));
create policy "editor write products" on products for all using (private.is_editor(workspace_id))
  with check (private.is_editor(workspace_id));

-- ── campaigns: member read; editor inserts as self; editor updates/deletes any ─
-- (owner_id is fixed at insert here; its immutability on update is enforced by
-- the campaigns_guard trigger in 0003.)
create policy "member read campaigns" on campaigns for select
  using (private.is_member(workspace_id));
create policy "editor insert campaigns" on campaigns for insert
  with check (private.is_editor(workspace_id) and owner_id = (select auth.uid()));
create policy "editor update campaigns" on campaigns for update
  using (private.is_editor(workspace_id)) with check (private.is_editor(workspace_id));
create policy "editor delete campaigns" on campaigns for delete
  using (private.is_editor(workspace_id));

-- ── ideas: member read; UPDATE only (trigger narrows to a status flip) ────────
create policy "member read ideas"   on campaign_ideas for select using (private.is_member(workspace_id));
create policy "editor decide ideas" on campaign_ideas for update using (private.is_editor(workspace_id))
  with check (private.is_editor(workspace_id));
-- INSERT/DELETE: generate-ideas Edge Function (service role) only.

-- ── assets: member read; editor update/delete; NO client insert (worker only) ─
create policy "member read assets"   on assets for select using (private.is_member(workspace_id));
create policy "editor update assets" on assets for update using (private.is_editor(workspace_id))
  with check (private.is_editor(workspace_id));
create policy "editor delete assets" on assets for delete using (private.is_editor(workspace_id));

-- ── generation jobs: member read only (progress UI) ───────────────────────────
create policy "member read jobs" on generation_jobs for select using (private.is_member(workspace_id));

-- ── notifications: member read; mark-read only (trigger narrows columns) ──────
create policy "member read notifications" on notifications for select using (private.is_member(workspace_id));
create policy "member mark read"          on notifications for update using (private.is_member(workspace_id))
  with check (private.is_member(workspace_id));
