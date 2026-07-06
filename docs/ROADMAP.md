# OREoS — Backend Roadmap, v2 (Supabase + Gemini API)

**Phase 2 deliverable** · 2026-07-05 · Supersedes the Firebase roadmap (archived). Same discipline: one sprint = one approval gate = one demo, measured by **which mock file dies**. A bonus of this stack: the Supabase connector in this workspace lets me provision the project, apply migrations, deploy Edge Functions, and run the security advisors directly — no console clicking required from you.

## Prerequisites
- Supabase organization (free tier covers B0–B3 dev) — I can create the project via the connector once you confirm org/region
- Gemini API key (AI Studio) → stored via `supabase secrets set GEMINI_API_KEY` (never in the repo)
- Vercel account for SPA hosting (connector available here too; can wait until B6)

## Sprints

### B0 — Provision + schema *(½–1 day)*
Create `oreos` Supabase project · apply migrations `0001_init` → `0004_pipeline` from [SCHEMA.md](SCHEMA.md) (tables, views, RLS, guard triggers, pgmq, cron, broadcast triggers, buckets) · `supabase gen types typescript` → `src/types/database.ts` · `src/lib/supabase.ts` client (publishable key) · seed script porting today's mock data so the UI stays populated · **run security advisors**; README setup section.
**Demo:** UI unchanged, but stat tiles read `workspace_stats`/`campaign_stats` views. **Mock killed:** none yet (foundation) — but the consistency invariant is now enforced by the database.

### B1 — Auth + tenancy *(Priority 1 begins)*
Sign-in/sign-up screens (email/password + Google), designed to the existing design system · `SessionContext` (session, workspace, role) + route guard · `handle_new_user` trigger creates profile + personal workspace · Team section live (invites, role changes, removal under RLS) · pgTAP tests for the member policies.
**Demo:** real sign-up → own workspace; a second account proves tenant isolation. **Mocks killed:** `currentUser`, `workspace`, `teamMembers`.

### B2 — Products + dossier extraction ⭐ *(first Gemini call)*
Upload from `ProductIntakePage` → `uploads` bucket · **`extract-dossier` Edge Function**: image path or URL → **gemini-3.5-flash** `generateContent` with ProductDossier `responseSchema`; **URL ingestion uses the `url_context` tool** (Gemini reads the page itself — the hand-rolled scraper and its risk are deleted from this plan) → Zod validate → service-role update (`dossier`, `status`) · broadcast refreshes the products list; existing skeletons cover `processing`.
**Demo:** real product photo or URL → live dossier in `ProductDetailPage`. **Mock killed:** `products.ts`.

### B3 — Campaigns + ideation + approval *(Priority 1 complete)*
Campaign CRUD against Postgres (existing page logic intact) · `generate-ideas` Edge Function → `campaign_ideas` rows · approve/reject = client updates constrained by `ideas_guard` · `CreateCampaignModal` wired end-to-end (product → campaign → pitched ideas).
**Demo:** dossier → 5–7 idea cards → batch approval, persistent across devices. **Mock killed:** `campaigns.ts`.

### B4 — Generation engine ⭐ *(Priority 2 begins)*
`approve-and-generate` (RPC or thin function): credit check → `generation_jobs` rows + `pgmq.send` fan-out · cron tick → `generation-worker`: **gemini-3.1-flash-image** (Interactions API, product/brand reference images) + 3.5-flash copy → `generated` bucket + `assets` row (`pending-review`) · progress UI from `generation_jobs` via broadcast · retries via visibility timeout, `attempts ≤ 3`, unique `(campaign, idea, format)` idempotency.
**Demo:** approve 3 ideas → watch branded assets stream into the library. **Mock killed:** `assets.ts` (its consistency contract now lives in the views).
**Risks:** image-model rate limits → 1 job/invocation + backoff; cost → `credits_used` incremented per job, gated before enqueue.

### B5 — Approvals, scheduling, notifications, dashboard
Approvals page = `status = 'pending-review'` query · asset transitions + `scheduled_at` (rule-guarded) · pipeline writes `notifications` (broadcast → bell) · dashboard KPIs + upcoming posts from live views/queries.
**Demo:** the whole loop is real; the 356-style invariant holds on live data by construction. **Mocks killed:** `mock.ts`, most of `settings.ts`.

### B6 — Hardening + launch
Security advisors + pgTAP attack tests (cross-tenant read/write, role escalation, status-jump, counter tamper) · Edge Function logging pass · rate-limit headers on functions · Vercel deploy (SPA + env) · Lighthouse/bundle check · README finalized (local dev with `supabase start`, migrations, secrets, deploy).
**Demo:** production URL, full flow on live services.

## Risk Register (v2)

| Risk | Sprint | Mitigation |
|---|---|---|
| Schema-invalid Gemini JSON | B2/B4 | `responseSchema` + Zod + one corrective retry → `needs-review`; never partial writes |
| Image-model rate limits / spend caps | B4 | pgmq sequential worker, visibility-timeout retries, credits gate |
| RLS gap leaks tenant data | B0+ | pgTAP policy tests + security advisors every sprint; guard triggers for old/new checks |
| Edge Function wall-clock limit | B4 | ≤ 1 image per invocation; cron fans out invocations |
| `url_context` fails on odd storefronts | B2 | fallback prompt-only extraction → `needs-review`; image upload remains primary path |
| Realtime misuse | B5 | broadcast-from-DB only; private channels with `realtime.messages` RLS |

## Open decisions (defaults applied on "go")
1. **Supabase org + project name** — default: project `oreos` in your existing org.
2. **Region** — default: `eu-central-1` (Frankfurt; lowest latency to Nairobi among Supabase regions — confirm at creation).
3. **Auth screens** — default: I design them to the existing design system.
