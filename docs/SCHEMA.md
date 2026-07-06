# OREoS — Postgres Schema & RLS (Supabase)

**Phase 2 deliverable, v2** · 2026-07-05 · Supersedes the Firestore schema (archived in [archive/firebase-plan/](archive/firebase-plan/)). The SQL below is the draft for migration `0001_init` in Sprint B0; table shapes mirror `src/types/index.ts` so wiring is mechanical. TypeScript DB types will be generated with `supabase gen types typescript` and reconciled against `src/types` at the data-hook seam.

> ⚠️ **Prototype status.** RLS is default-deny with role gates, column protection, and trigger-enforced state machines — but it must pass pgTAP policy tests and the Supabase **security advisors** before production traffic, and you should review it.

## 1. Entity Overview

```
auth.users ──1:1── profiles
workspaces ──< workspace_members (role) >── profiles
workspaces ──< brands
workspaces ──< products (dossier jsonb)
workspaces ──< campaigns ──< campaign_ideas
workspaces ──< assets (campaign_id FK)          ← library queries across campaigns
workspaces ──< generation_jobs (+ pgmq queue)
workspaces ──< notifications
campaign_stats / workspace_stats                 ← VIEWS: the mock consistency invariant, structural
```

## 2. Migration draft (`supabase/migrations/0001_init.sql`)

```sql
-- ===== enums (mirror src/types unions) ==================================
create type team_role         as enum ('owner','editor','viewer');
create type plan_type         as enum ('trial','pro');
create type product_source    as enum ('url','upload');
create type product_status    as enum ('processing','ready','needs-review');
create type campaign_status   as enum ('draft','active','completed','paused','archived');
create type idea_status       as enum ('proposed','approved','rejected','generated');
create type asset_type        as enum ('image','video','carousel','story');
create type asset_status      as enum ('draft','pending-review','approved','scheduled','published');
create type platform          as enum ('instagram','facebook','tiktok','linkedin');
create type job_status        as enum ('queued','running','succeeded','failed');
create type notification_kind as enum ('success','warning','ai','info');

-- ===== tables ===========================================================
create table profiles (
  id         uuid primary key references auth.users on delete cascade,
  name       text not null check (char_length(name) between 1 and 80),
  email      text not null,
  timezone   text not null default 'Africa/Nairobi' check (char_length(timezone) <= 60),
  created_at timestamptz not null default now()
);

create table workspaces (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null check (char_length(name) between 1 and 60),
  slug                text not null unique check (slug ~ '^[a-z0-9-]{1,40}$'),
  logo_url            text check (logo_url ~ '^https://' and char_length(logo_url) <= 500),
  default_brand_voice text check (char_length(default_brand_voice) <= 80),
  owner_id            uuid not null references profiles,
  plan                plan_type not null default 'trial',
  credits_used        int  not null default 0 check (credits_used >= 0),
  credits_total       int  not null default 2000 check (credits_total >= 0),
  created_at          timestamptz not null default now()
);

create table workspace_members (
  workspace_id uuid not null references workspaces on delete cascade,
  user_id      uuid not null references profiles on delete cascade,
  role         team_role not null,
  added_at     timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table brands (
  id                  uuid primary key default gen_random_uuid(),
  workspace_id        uuid not null references workspaces on delete cascade,
  name                text not null check (char_length(name) between 1 and 80),
  logo_url            text check (logo_url ~ '^https://'),
  industry            text check (char_length(industry) <= 60),
  colors              text[] not null default '{}' check (cardinality(colors) <= 8),
  typography_headline text check (char_length(typography_headline) <= 120),
  voice_summary       text check (char_length(voice_summary) <= 600),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table products (
  id               uuid primary key default gen_random_uuid(),
  workspace_id     uuid not null references workspaces on delete cascade,
  brand_id         uuid references brands on delete set null,
  name             text not null check (char_length(name) between 1 and 120),
  category         text check (char_length(category) <= 60),
  source_type      product_source not null,
  source_url       text check (source_url ~ '^https://' and char_length(source_url) <= 800),
  upload_path      text,                       -- storage object path, validated by trigger
  status           product_status not null default 'processing',
  dossier          jsonb,                      -- ProductDossier; service-role writes only
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table campaigns (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces on delete cascade,
  brand_id     uuid references brands on delete set null,
  product_id   uuid references products on delete set null,
  name         text not null check (char_length(name) between 1 and 100),
  description  text check (char_length(description) <= 300),
  status       campaign_status not null default 'draft',
  platforms    platform[] not null default '{}' check (cardinality(platforms) <= 4),
  tags         text[] not null default '{}' check (cardinality(tags) <= 10),
  owner_id     uuid not null references profiles,
  start_at     timestamptz,
  end_at       timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table campaign_ideas (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns on delete cascade,
  workspace_id uuid not null references workspaces on delete cascade, -- denorm for RLS speed
  title       text not null check (char_length(title) <= 120),
  description text not null check (char_length(description) <= 500),
  format      asset_type not null,
  platforms   platform[] not null default '{}',
  rationale   text check (char_length(rationale) <= 300),
  status      idea_status not null default 'proposed',
  created_at  timestamptz not null default now()
);

create table assets (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces on delete cascade,
  campaign_id   uuid not null references campaigns on delete cascade,
  idea_id       uuid references campaign_ideas on delete set null,
  name          text not null check (char_length(name) <= 160),
  type          asset_type not null,
  status        asset_status not null default 'pending-review',
  platform      platform not null,
  storage_path  text not null,
  size_label    text check (char_length(size_label) <= 12),
  duration_sec  int check (duration_sec between 0 and 600),
  copy_caption  text check (char_length(copy_caption) <= 2200),
  copy_hashtags text[] default '{}' check (cardinality(copy_hashtags) <= 30),
  tags          text[] not null default '{}' check (cardinality(tags) <= 10),
  scheduled_at  timestamptz,
  created_at    timestamptz not null default now()
);

create table generation_jobs (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces on delete cascade,
  campaign_id  uuid not null references campaigns on delete cascade,
  idea_id      uuid not null references campaign_ideas on delete cascade,
  format       asset_type not null,
  status       job_status not null default 'queued',
  attempts     int not null default 0 check (attempts <= 3),
  error        text check (char_length(error) <= 500),
  created_at   timestamptz not null default now(),
  finished_at  timestamptz,
  unique (campaign_id, idea_id, format)        -- idempotency key
);

create table notifications (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces on delete cascade,
  kind         notification_kind not null,
  message      text not null check (char_length(message) <= 300),
  read_by      uuid[] not null default '{}',
  created_at   timestamptz not null default now()
);

-- ===== the consistency invariant, structural ============================
create view campaign_stats with (security_invoker = true) as
select
  c.id as campaign_id,
  c.workspace_id,
  count(a.id)                                          as assets,
  count(a.id) filter (where a.status = 'scheduled')    as scheduled,
  count(a.id) filter (where a.status = 'published')    as published,
  count(a.id) filter (where a.status = 'pending-review') as pending_review
from campaigns c
left join assets a on a.campaign_id = c.id
group by c.id;

create view workspace_stats with (security_invoker = true) as
select
  w.id as workspace_id,
  (select count(*) from campaigns c where c.workspace_id = w.id and c.status <> 'archived') as campaigns,
  (select count(*) from assets a where a.workspace_id = w.id)                               as assets,
  (select count(*) from assets a where a.workspace_id = w.id and a.status = 'scheduled')    as scheduled_posts,
  (select count(*) from assets a where a.workspace_id = w.id and a.status = 'pending-review') as pending_review
from workspaces w;

-- ===== indexes (incl. every column used in RLS) =========================
create index on workspace_members (user_id);
create index on brands (workspace_id);
create index on products (workspace_id, status);
create index on campaigns (workspace_id, status, updated_at desc);
create index on campaign_ideas (campaign_id, status);
create index on campaign_ideas (workspace_id);
create index on assets (workspace_id, created_at desc);
create index on assets (campaign_id, created_at desc);
create index on assets (workspace_id, status, scheduled_at);
create index on assets (workspace_id, type);
create index on generation_jobs (workspace_id, status, created_at);
create index on notifications (workspace_id, created_at desc);
```

## 3. Authorization (`0002_rls.sql`)

```sql
-- helper lives in a private schema (not exposed over PostgREST);
-- SECURITY DEFINER avoids RLS recursion on workspace_members
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

-- enable RLS everywhere (default deny)
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

-- profiles: strictly self
create policy "own profile read"   on profiles for select using (id = (select auth.uid()));
create policy "own profile update" on profiles for update using (id = (select auth.uid()))
  with check (id = (select auth.uid()) and email = (select email from auth.users where id = auth.uid()));

-- workspaces: member read; owner update (plan/credits protected by trigger below)
create policy "member read ws"  on workspaces for select using (private.is_member(id));
create policy "owner update ws" on workspaces for update using (private.is_owner(id))
  with check (private.is_owner(id));

-- members: member read; owner manages others (never self, never the ws owner)
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

-- brands / products / campaigns: member read, editor write
create policy "member read brands"  on brands    for select using (private.is_member(workspace_id));
create policy "editor write brands" on brands    for all    using (private.is_editor(workspace_id))
  with check (private.is_editor(workspace_id));
create policy "member read products"  on products for select using (private.is_member(workspace_id));
create policy "editor write products" on products for all    using (private.is_editor(workspace_id))
  with check (private.is_editor(workspace_id));
create policy "member read campaigns"  on campaigns for select using (private.is_member(workspace_id));
create policy "editor write campaigns" on campaigns for all   using (private.is_editor(workspace_id))
  with check (private.is_editor(workspace_id) and owner_id = (select auth.uid()) is not false);

-- ideas: member read; UPDATE only (no client insert/delete) — trigger narrows to status flip
create policy "member read ideas"   on campaign_ideas for select using (private.is_member(workspace_id));
create policy "editor decide ideas" on campaign_ideas for update using (private.is_editor(workspace_id))
  with check (private.is_editor(workspace_id));

-- assets: member read; editor update/delete; NO client insert (worker only)
create policy "member read assets"   on assets for select using (private.is_member(workspace_id));
create policy "editor update assets" on assets for update using (private.is_editor(workspace_id))
  with check (private.is_editor(workspace_id));
create policy "editor delete assets" on assets for delete using (private.is_editor(workspace_id));

-- jobs: member read only
create policy "member read jobs" on generation_jobs for select using (private.is_member(workspace_id));

-- notifications: member read; mark-read only (trigger narrows columns)
create policy "member read notifications" on notifications for select using (private.is_member(workspace_id));
create policy "member mark read"          on notifications for update using (private.is_member(workspace_id))
  with check (private.is_member(workspace_id));
```

## 4. State machines & column protection (`0003_triggers.sql`)

RLS decides *who*; `BEFORE` triggers decide *what change is legal* (Postgres lets triggers compare `old`/`new`, which policies cannot):

| Trigger | Enforces |
|---|---|
| `campaigns_guard` | status transitions `draft→active`, `active→paused\|completed\|archived`, `paused→active\|archived`, `completed→archived`; `owner_id`,`created_at` immutable |
| `ideas_guard` | non-service-role updates may change **only** `status`, and only `proposed→approved\|rejected` |
| `assets_guard` | non-service-role updates may change only `status`/`scheduled_at`; transitions `draft→pending-review→approved⇄scheduled`; `published` reachable only by service role |
| `products_guard` | `dossier`, `status` writable only by service role (client may create with `status='processing'`) |
| `workspaces_guard` | `plan`, `credits_used`, `credits_total`, `owner_id` service-role only |
| `notifications_guard` | clients may only append their own uid to `read_by` |
| `updated_at` touch triggers | brands/products/campaigns |
| `handle_new_user` (`auth.users` AFTER INSERT, security definer) | creates `profiles` row + personal workspace + owner membership — native replacement for the Firebase bootstrap callable |

(Representative implementation of one guard; the rest follow the same pattern:)

```sql
create or replace function private.assets_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.role()) = 'service_role' then return new; end if;
  if (new.id, new.workspace_id, new.campaign_id, new.name, new.type, new.platform,
      new.storage_path, new.copy_caption, new.created_at)
     is distinct from
     (old.id, old.workspace_id, old.campaign_id, old.name, old.type, old.platform,
      old.storage_path, old.copy_caption, old.created_at) then
    raise exception 'only status/scheduled_at are client-editable';
  end if;
  if not ( (old.status = 'draft'          and new.status = 'pending-review')
        or (old.status = 'pending-review' and new.status in ('approved','draft'))
        or (old.status = 'approved'       and new.status in ('scheduled','pending-review'))
        or (old.status = 'scheduled'      and new.status = 'approved')
        or (old.status = new.status) ) then
    raise exception 'illegal asset status transition % -> %', old.status, new.status;
  end if;
  return new;
end $$;
create trigger assets_guard before update on assets
  for each row execute function private.assets_guard();
```

## 5. Queue & realtime (`0004_pipeline.sql`)

- **Queue:** `select pgmq.create('generation_jobs')`; `approve-and-generate` inserts `generation_jobs` rows + `pgmq.send` messages. **pg_cron** (every 10 s) calls a `private.tick_generation()` function that `pgmq.read`s (visibility timeout 5 min = retry window) and invokes the `generation-worker` Edge Function via **pg_net**, with the function URL/key stored in **Vault** — the documented Supabase pattern for AI job processing. Worker processes ~1 image per invocation (stays far under Edge Function wall-clock limits), archives the message on success, lets visibility timeout requeue on crash, and marks `failed` after `attempts = 3`.
- **Realtime:** per current guidance we use **broadcast from database** (not `postgres_changes`): AFTER-triggers on `assets`, `generation_jobs`, `notifications`, `products` call `realtime.broadcast_changes('workspace:' || new.workspace_id, …)`; clients subscribe to the **private channel** `workspace:{id}`, authorized by an RLS policy on `realtime.messages` that checks `private.is_member(...)` against the topic.

## 6. Storage buckets & policies

| Bucket | Path convention | Write | Read | Limits |
|---|---|---|---|---|
| `uploads` | `{workspace_id}/{product_id}/{file}` | members (`is_member` on first path segment) | members | `image/png,jpeg,webp`, ≤ 15 MB |
| `generated` | `{workspace_id}/{asset_id}.png` | **service role only** | members | n/a |
| `branding` | `{workspace_id}/{file}` | members | members | images, ≤ 2 MB |

```sql
create policy "members upload product images" on storage.objects for insert
  with check (
    bucket_id = 'uploads'
    and private.is_member((storage.foldername(name))[1]::uuid)
  );
create policy "members read workspace files" on storage.objects for select
  using (
    bucket_id in ('uploads','generated','branding')
    and private.is_member((storage.foldername(name))[1]::uuid)
  );
-- no insert/update policy on 'generated' → only service role can write it
```

## 7. What the client gets

`supabase gen types typescript` output becomes `src/types/database.ts`; the existing hand-written types in `src/types/index.ts` stay as the UI contract, with thin mappers in the data hooks (`snake_case → camelCase`). Stat tiles read `campaign_stats` / `workspace_stats` — the same numbers the mock generator guaranteed, now guaranteed by the database itself.
