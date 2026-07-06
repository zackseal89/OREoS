-- ============================================================================
-- OREoS 0001_init — enums, tables, stat views, indexes
-- Mirrors src/types/index.ts. See docs/SCHEMA.md for rationale.
-- ============================================================================

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
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces on delete cascade,
  brand_id     uuid references brands on delete set null,
  name         text not null check (char_length(name) between 1 and 120),
  category     text check (char_length(category) <= 60),
  source_type  product_source not null,
  source_url   text check (source_url ~ '^https://' and char_length(source_url) <= 800),
  upload_path  text,                       -- storage object path, validated by trigger
  status       product_status not null default 'processing',
  dossier      jsonb,                      -- ProductDossier; service-role writes only
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
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
  id           uuid primary key default gen_random_uuid(),
  campaign_id  uuid not null references campaigns on delete cascade,
  workspace_id uuid not null references workspaces on delete cascade, -- denorm for RLS speed
  title        text not null check (char_length(title) <= 120),
  description  text not null check (char_length(description) <= 500),
  format       asset_type not null,
  platforms    platform[] not null default '{}',
  rationale    text check (char_length(rationale) <= 300),
  status       idea_status not null default 'proposed',
  created_at   timestamptz not null default now()
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
-- security_invoker = the caller's RLS applies, so these views never leak
-- across workspaces.
create view campaign_stats with (security_invoker = true) as
select
  c.id as campaign_id,
  c.workspace_id,
  count(a.id)                                            as assets,
  count(a.id) filter (where a.status = 'scheduled')      as scheduled,
  count(a.id) filter (where a.status = 'published')      as published,
  count(a.id) filter (where a.status = 'pending-review') as pending_review
from campaigns c
left join assets a on a.campaign_id = c.id
group by c.id;

create view workspace_stats with (security_invoker = true) as
select
  w.id as workspace_id,
  (select count(*) from campaigns c where c.workspace_id = w.id and c.status <> 'archived') as campaigns,
  (select count(*) from assets a where a.workspace_id = w.id)                                as assets,
  (select count(*) from assets a where a.workspace_id = w.id and a.status = 'scheduled')     as scheduled_posts,
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
