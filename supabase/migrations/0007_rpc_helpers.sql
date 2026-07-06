-- Helper to increment credits safely
create or replace function public.increment_workspace_credits(ws_id uuid, amount int)
returns void
language plpgsql
security definer
as $$
begin
  update workspaces
  set credits_used = credits_used + amount
  where id = ws_id;
end;
$$;

-- RPC for pgmq delete (standard pgmq doesn't always expose this to PostgREST easily)
create or replace function public.pgmq_delete(queue_name text, msg_id bigint)
returns boolean
language plpgsql
security definer
as $$
begin
  return pgmq.delete(queue_name, msg_id);
end;
$$;
