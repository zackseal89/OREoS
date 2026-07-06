-- ============================================================================
-- OREoS 0004_pipeline — generation queue, storage, realtime, cron worker tick.
-- See docs/ARCHITECTURE.md §2/§3 and docs/SCHEMA.md §5/§6.
--
-- RUNTIME PREREQUISITES (do not block this migration, needed before generation
-- actually runs — see README "Backend setup"):
--   • Vault secrets `project_url` and `service_role_key`
--   • Edge Function `generation-worker` deployed
-- ============================================================================

create extension if not exists pgmq;
create extension if not exists pg_net;
create extension if not exists pg_cron;

-- ── generation job queue ──────────────────────────────────────────────────────
select pgmq.create('generation_jobs');

-- ── storage buckets (portable: works locally and on remote) ───────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('uploads',   'uploads',   false, 15728640, array['image/png','image/jpeg','image/webp']),
  ('generated', 'generated', false, null,     null),
  ('branding',  'branding',  false, 2097152,  array['image/png','image/jpeg','image/webp','image/svg+xml'])
on conflict (id) do nothing;

-- Path convention: {workspace_id}/... — first folder segment is the workspace id.
create policy "members read workspace files" on storage.objects for select to authenticated
  using (
    bucket_id in ('uploads','generated','branding')
    and private.is_member((storage.foldername(name))[1]::uuid)
  );
create policy "members upload product images" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'uploads'
    and private.is_member((storage.foldername(name))[1]::uuid)
  );
create policy "members upload branding" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'branding'
    and private.is_member((storage.foldername(name))[1]::uuid)
  );
create policy "members delete their uploads" on storage.objects for delete to authenticated
  using (
    bucket_id in ('uploads','branding')
    and private.is_member((storage.foldername(name))[1]::uuid)
  );
-- No insert/update/delete policy references 'generated' → only the service_role
-- (generation-worker) can write generated assets.

-- ── realtime: broadcast from database on the private channel workspace:{id} ───
-- One generic trigger fn works for any table carrying a workspace_id column.
create or replace function private.broadcast_workspace_change() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  ws uuid;
begin
  ws := coalesce(
    (to_jsonb(new) ->> 'workspace_id'),
    (to_jsonb(old) ->> 'workspace_id')
  )::uuid;
  perform realtime.broadcast_changes(
    'workspace:' || ws::text,  -- topic
    tg_op,                     -- event
    tg_op,                     -- operation
    tg_table_name,             -- table
    tg_table_schema,           -- schema
    new,                       -- new record
    old                        -- old record
  );
  return null;
end $$;

create trigger broadcast_assets
  after insert or update or delete on public.assets
  for each row execute function private.broadcast_workspace_change();
create trigger broadcast_jobs
  after insert or update or delete on public.generation_jobs
  for each row execute function private.broadcast_workspace_change();
create trigger broadcast_notifications
  after insert or update or delete on public.notifications
  for each row execute function private.broadcast_workspace_change();
create trigger broadcast_products
  after insert or update or delete on public.products
  for each row execute function private.broadcast_workspace_change();

-- Authorize subscriptions to private workspace channels: a client may receive
-- broadcasts on workspace:{id} only if they are a member of {id}.
create policy "members receive workspace broadcasts"
  on realtime.messages for select to authenticated
  using (
    (select realtime.topic()) like 'workspace:%'
    and private.is_member(substring((select realtime.topic()) from 'workspace:(.*)')::uuid)
  );

-- ── cron worker tick: drain the queue and invoke the worker Edge Function ─────
-- Reads a small batch with a 5-minute visibility timeout (the retry window), and
-- forwards each message to the worker. The worker does the Gemini work and, on
-- success, deletes the message (service role). A crash lets the VT requeue it.
create or replace function private.tick_generation() returns void
language plpgsql security definer set search_path = '' as $$
declare
  proj_url    text;
  service_key text;
  msg         record;
begin
  select decrypted_secret into proj_url    from vault.decrypted_secrets where name = 'project_url';
  select decrypted_secret into service_key from vault.decrypted_secrets where name = 'service_role_key';
  if proj_url is null or service_key is null then
    return;  -- secrets not configured yet → no-op (safe before B4 wiring)
  end if;

  for msg in select * from pgmq.read('generation_jobs', 300, 5) loop
    perform net.http_post(
      url     := proj_url || '/functions/v1/generation-worker',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || service_key
      ),
      body    := jsonb_build_object('msg_id', msg.msg_id, 'message', msg.message)
    );
  end loop;
end $$;

select cron.schedule('oreos-generation-tick', '10 seconds', $$ select private.tick_generation(); $$);
