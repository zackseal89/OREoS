-- ============================================================================
-- OREoS 0014 — repair guard triggers left stale by later column changes.
--
-- ideas_guard (0003) still referenced new.rationale, but 0005 renamed that
-- column to strategic_rationale — so EVERY client update on campaign_ideas
-- (the approve/reject HITL gate) failed with 42703. Recreate it with the
-- current column set, locking the new strategy fields too.
--
-- assets_guard predates 0006/0011: performance_score, brand_fit_score,
-- strategic_rationale, regeneration_options, postproxy_post_id and
-- publish_error were client-writable. Lock them (pipeline/service-role only).
-- ============================================================================

create or replace function private.ideas_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.role() = 'service_role' then return new; end if;
  if (new.campaign_id, new.workspace_id, new.title, new.description, new.format,
      new.platforms, new.strategic_rationale, new.creative_direction,
      new.content_pillar, new.created_at)
     is distinct from
     (old.campaign_id, old.workspace_id, old.title, old.description, old.format,
      old.platforms, old.strategic_rationale, old.creative_direction,
      old.content_pillar, old.created_at) then
    raise exception 'only status is client-editable on ideas';
  end if;
  if not (old.status = 'proposed' and new.status in ('approved','rejected')) then
    raise exception 'ideas can only go proposed -> approved|rejected';
  end if;
  return new;
end $$;

create or replace function private.assets_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.role() = 'service_role' then return new; end if;
  if (new.id, new.workspace_id, new.campaign_id, new.idea_id, new.name, new.type,
      new.platform, new.storage_path, new.size_label, new.duration_sec,
      new.copy_caption, new.copy_hashtags, new.tags, new.created_at,
      new.performance_score, new.brand_fit_score, new.strategic_rationale,
      new.regeneration_options, new.postproxy_post_id, new.publish_error)
     is distinct from
     (old.id, old.workspace_id, old.campaign_id, old.idea_id, old.name, old.type,
      old.platform, old.storage_path, old.size_label, old.duration_sec,
      old.copy_caption, old.copy_hashtags, old.tags, old.created_at,
      old.performance_score, old.brand_fit_score, old.strategic_rationale,
      old.regeneration_options, old.postproxy_post_id, old.publish_error) then
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
