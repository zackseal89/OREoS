-- ============================================================================
-- OREoS 0003_triggers — state machines, column protection, user bootstrap.
-- RLS (0002) decides WHO may write; these BEFORE triggers decide WHAT change is
-- legal, by comparing OLD/NOW — something policies cannot do. All bypass for the
-- service_role (Edge Functions), which is the only writer of pipeline columns.
-- ============================================================================

-- ── profiles: id/email/created_at immutable ───────────────────────────────────
create or replace function private.profiles_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.id is distinct from old.id
     or new.email is distinct from old.email
     or new.created_at is distinct from old.created_at then
    raise exception 'id, email and created_at are immutable';
  end if;
  return new;
end $$;
create trigger profiles_guard before update on public.profiles
  for each row execute function private.profiles_guard();

-- ── workspaces: owner_id/plan/credits are system-managed ──────────────────────
create or replace function private.workspaces_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.role() = 'service_role' then return new; end if;
  if new.owner_id is distinct from old.owner_id
     or new.plan is distinct from old.plan
     or new.credits_used is distinct from old.credits_used
     or new.credits_total is distinct from old.credits_total
     or new.created_at is distinct from old.created_at then
    raise exception 'owner_id, plan and credits are managed by the system';
  end if;
  return new;
end $$;
create trigger workspaces_guard before update on public.workspaces
  for each row execute function private.workspaces_guard();

-- ── products: status/dossier are pipeline-owned; create must start clean ──────
create or replace function private.products_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.role() = 'service_role' then return new; end if;

  if tg_op = 'INSERT' then
    if new.status <> 'processing' then
      raise exception 'new products must start in processing status';
    end if;
    if new.dossier is not null then
      raise exception 'dossier is written by the extraction pipeline, not the client';
    end if;
    if new.upload_path is not null
       and new.upload_path !~ ('^' || new.workspace_id::text || '/') then
      raise exception 'upload_path must be scoped to the workspace';
    end if;
    return new;
  end if;

  -- UPDATE
  if new.status is distinct from old.status
     or new.dossier is distinct from old.dossier then
    raise exception 'status and dossier are written by the pipeline';
  end if;
  return new;
end $$;
create trigger products_guard before insert or update on public.products
  for each row execute function private.products_guard();

-- ── campaigns: status state machine; owner_id/created_at immutable ────────────
create or replace function private.campaigns_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.role() = 'service_role' then return new; end if;
  if new.owner_id is distinct from old.owner_id
     or new.created_at is distinct from old.created_at then
    raise exception 'owner_id and created_at are immutable';
  end if;
  if not ( old.status = new.status
        or (old.status = 'draft'     and new.status in ('active','archived'))
        or (old.status = 'active'    and new.status in ('paused','completed','archived'))
        or (old.status = 'paused'    and new.status in ('active','archived'))
        or (old.status = 'completed' and new.status = 'archived') ) then
    raise exception 'illegal campaign status transition % -> %', old.status, new.status;
  end if;
  return new;
end $$;
create trigger campaigns_guard before update on public.campaigns
  for each row execute function private.campaigns_guard();

-- ── ideas: clients may only flip status proposed -> approved|rejected ─────────
create or replace function private.ideas_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.role() = 'service_role' then return new; end if;
  if (new.campaign_id, new.workspace_id, new.title, new.description, new.format,
      new.platforms, new.rationale, new.created_at)
     is distinct from
     (old.campaign_id, old.workspace_id, old.title, old.description, old.format,
      old.platforms, old.rationale, old.created_at) then
    raise exception 'only status is client-editable on ideas';
  end if;
  if not (old.status = 'proposed' and new.status in ('approved','rejected')) then
    raise exception 'ideas can only go proposed -> approved|rejected';
  end if;
  return new;
end $$;
create trigger ideas_guard before update on public.campaign_ideas
  for each row execute function private.ideas_guard();

-- ── assets: clients may only change status/scheduled_at; status state machine ─
create or replace function private.assets_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.role() = 'service_role' then return new; end if;
  if (new.id, new.workspace_id, new.campaign_id, new.idea_id, new.name, new.type,
      new.platform, new.storage_path, new.size_label, new.duration_sec,
      new.copy_caption, new.copy_hashtags, new.tags, new.created_at)
     is distinct from
     (old.id, old.workspace_id, old.campaign_id, old.idea_id, old.name, old.type,
      old.platform, old.storage_path, old.size_label, old.duration_sec,
      old.copy_caption, old.copy_hashtags, old.tags, old.created_at) then
    raise exception 'only status and scheduled_at are client-editable';
  end if;
  if not ( old.status = new.status
        or (old.status = 'draft'          and new.status = 'pending-review')
        or (old.status = 'pending-review' and new.status in ('approved','draft'))
        or (old.status = 'approved'       and new.status in ('scheduled','pending-review'))
        or (old.status = 'scheduled'      and new.status = 'approved') ) then
    -- 'published' is reachable only by the service_role (publisher).
    raise exception 'illegal asset status transition % -> %', old.status, new.status;
  end if;
  return new;
end $$;
create trigger assets_guard before update on public.assets
  for each row execute function private.assets_guard();

-- ── notifications: clients may only append their own uid to read_by ───────────
create or replace function private.notifications_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.role() = 'service_role' then return new; end if;
  if (new.workspace_id, new.kind, new.message, new.created_at)
     is distinct from
     (old.workspace_id, old.kind, old.message, old.created_at) then
    raise exception 'only read_by is client-editable on notifications';
  end if;
  if new.read_by is distinct from (old.read_by || (select auth.uid()))
     and new.read_by is distinct from old.read_by then
    raise exception 'read_by may only append your own uid';
  end if;
  return new;
end $$;
create trigger notifications_guard before update on public.notifications
  for each row execute function private.notifications_guard();

-- ── updated_at touch (brands/products/campaigns) ──────────────────────────────
create or replace function private.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;
create trigger touch_brands    before update on public.brands
  for each row execute function private.touch_updated_at();
create trigger touch_products  before update on public.products
  for each row execute function private.touch_updated_at();
create trigger touch_campaigns before update on public.campaigns
  for each row execute function private.touch_updated_at();

-- ── user bootstrap: profile + personal workspace + owner membership ───────────
-- Native replacement for the Firebase "bootstrap callable": fires when Supabase
-- Auth inserts a new user, so first sign-in lands in a ready-to-use workspace.
create or replace function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  display_name text;
  ws_id     uuid;
  base_slug text;
  try_slug  text;
  suffix    int := 0;
begin
  display_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'name', ''),
    split_part(new.email, '@', 1)
  );

  insert into public.profiles (id, name, email)
  values (new.id, left(display_name, 80), new.email);

  base_slug := regexp_replace(lower(split_part(new.email, '@', 1)), '[^a-z0-9-]', '-', 'g');
  base_slug := left(regexp_replace(base_slug, '-+', '-', 'g'), 32);
  if base_slug = '' or base_slug = '-' then base_slug := 'workspace'; end if;

  try_slug := base_slug;
  loop
    begin
      insert into public.workspaces (name, slug, owner_id)
      values (left(display_name || '''s Workspace', 60), try_slug, new.id)
      returning id into ws_id;
      exit;
    exception when unique_violation then
      suffix := suffix + 1;
      try_slug := left(base_slug, 34) || '-' || suffix::text;
    end;
  end loop;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (ws_id, new.id, 'owner');

  return new;
end $$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();
