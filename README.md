# OREoS

AI Marketing Operating System for e-commerce brands. Upload a product (image or URL), OREoS extracts a brand dossier (colors, typography, voice), pitches campaign ideas, and generates branded marketing assets on approval.

## Stack

- **Frontend:** React 19 + TypeScript (strict) + Vite + Tailwind CSS v4
- **Backend (planned):** Supabase — Postgres + RLS, Auth, Storage, Edge Functions, pgmq/pg_cron job queue
- **AI:** Google Gemini API (`gemini-3.5-flash` for extraction/ideation/copy, `gemini-3.1-flash-image` / Nano Banana 2 for asset generation) — called only from server-side Edge Functions, never the client

## Status

The frontend is built out across dashboard, campaigns, products, assets library, settings, and supporting flows, all running on typed mock data. The backend architecture is designed but not yet implemented — see [docs/](docs/) for the full plan:

- [`docs/RESEARCH_BRIEF.md`](docs/RESEARCH_BRIEF.md) — verified SDK/model versions and API research
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system architecture
- [`docs/SCHEMA.md`](docs/SCHEMA.md) — database schema and RLS policies (draft)
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — sprint-by-sprint backend build plan
- [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) — design tokens and component conventions
- [`docs/archive/firebase-plan/`](docs/archive/firebase-plan/) — earlier Firebase-based architecture, superseded

## Development

```bash
npm install
cp .env.example .env   # fill in VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY
npm run dev            # start the dev server
npm run build          # type-check (tsc -b) + production build
npm run lint           # oxlint
```

## Backend (Supabase)

The backend is scaffolded under [`supabase/`](supabase/) and follows [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) / [`docs/SCHEMA.md`](docs/SCHEMA.md). It is **not yet provisioned against a live project** — the app runs on mock data until the migrations are applied and the data hooks are wired (roadmap sprints B1+).

```
supabase/
├── config.toml                    # local/remote CLI config
├── migrations/
│   ├── 0001_init.sql              # enums, tables, stat views, indexes
│   ├── 0002_rls.sql               # role helpers + RLS policies (default deny)
│   ├── 0003_triggers.sql          # state-machine guards + user bootstrap
│   └── 0004_pipeline.sql          # pgmq queue, storage, realtime, cron tick
└── functions/                     # Deno Edge Functions
    ├── _shared/                   # clients, gemini, schemas, helpers
    ├── extract-dossier/           # B2 — product → brand dossier
    ├── generate-ideas/            # B3 — campaign → 5–7 ideas
    └── generation-worker/         # B4 — queue → generated assets
```

### Backend setup (when provisioning)

```bash
npm i -g supabase                       # or use npx supabase ...
supabase link --project-ref <ref>       # link a created project
supabase db push                        # apply migrations
supabase secrets set GEMINI_API_KEY=... # server-only, never a VITE_ var
supabase functions deploy               # deploy the Edge Functions
```

Runtime prerequisites for the generation pipeline (see [`0004_pipeline.sql`](supabase/migrations/0004_pipeline.sql)): set Vault secrets `project_url` and `service_role_key` so the `pg_cron` tick can invoke `generation-worker`.

**Security:** every table is default-deny RLS; server-only secrets live in Supabase secrets / Vault and never in the client bundle. The RLS + trigger policies are a reviewed **prototype** — run the Supabase security advisors and pgTAP tests before production traffic.

## Project layout

```
src/
├── components/    # ui/ primitives, layout/, and feature folders (dashboard, campaigns, assets, settings, ...)
├── data/          # typed mock datasets (source of truth until the backend lands)
├── hooks/         # shared hooks (toast, click-outside, ...)
├── lib/           # small utilities
├── pages/         # one file per route
└── types/         # shared TypeScript types, mirrored by the future database schema
```
