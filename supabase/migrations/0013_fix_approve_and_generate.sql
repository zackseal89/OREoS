-- ============================================================================
-- OREoS 0013 — fix approve_and_generate: 0010 used min(workspace_id), but
-- Postgres has no min(uuid) aggregate, so every call failed with 42883
-- (surfaced by PostgREST as a 404). Same function, uuid-safe workspace lookup.
-- ============================================================================

create or replace function public.approve_and_generate(idea_ids uuid[])
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  ws        uuid;
  ws_count  int;
  needed    int;
  available int;
  approved  int := 0;
  queued    int := 0;
  idea      record;
  job_id    uuid;
begin
  if idea_ids is null or cardinality(idea_ids) = 0 then
    raise exception 'idea_ids must be a non-empty array';
  end if;

  -- All ideas must belong to one workspace, and the caller must be an editor.
  select count(distinct workspace_id) into ws_count
    from public.campaign_ideas
   where id = any(idea_ids);
  if ws_count = 0 then
    raise exception 'no such ideas';
  end if;
  if ws_count > 1 then
    raise exception 'ideas span multiple workspaces';
  end if;
  select workspace_id into ws
    from public.campaign_ideas
   where id = any(idea_ids)
   limit 1;
  if not private.is_editor(ws) then
    raise exception 'only editors can approve ideas';
  end if;

  -- Credit gate: one credit per idea that still needs a job.
  select count(*) into needed
    from public.campaign_ideas i
   where i.id = any(idea_ids)
     and not exists (
       select 1 from public.generation_jobs j
        where j.idea_id = i.id and j.campaign_id = i.campaign_id and j.format = i.format
     );
  select credits_total - credits_used into available
    from public.workspaces where id = ws;
  if needed > available then
    raise exception 'not enough credits: need %, have %', needed, available;
  end if;

  for idea in
    select * from public.campaign_ideas
     where id = any(idea_ids)
       and status in ('proposed', 'approved')  -- approved = retry-safe re-call
  loop
    if idea.status = 'proposed' then
      update public.campaign_ideas set status = 'approved' where id = idea.id;
      approved := approved + 1;
    end if;

    insert into public.generation_jobs (workspace_id, campaign_id, idea_id, format)
    values (idea.workspace_id, idea.campaign_id, idea.id, idea.format)
    on conflict (campaign_id, idea_id, format) do nothing
    returning id into job_id;

    if job_id is not null then
      perform pgmq.send(
        'generation_jobs',
        jsonb_build_object(
          'jobId',       job_id,
          'workspaceId', idea.workspace_id,
          'campaignId',  idea.campaign_id,
          'ideaId',      idea.id,
          'format',      idea.format
        )
      );
      queued := queued + 1;
    end if;
  end loop;

  if queued > 0 then
    insert into public.notifications (workspace_id, kind, message)
    values (ws, 'ai', queued || ' asset generation job' || case when queued = 1 then '' else 's' end || ' queued');
  end if;

  return jsonb_build_object('approved', approved, 'queued', queued);
end $$;
