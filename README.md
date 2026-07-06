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
npm run dev      # start the dev server
npm run build    # type-check (tsc -b) + production build
npm run lint      # oxlint
```

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
