# OREoS — Backend Development Roadmap (Phase 3)

**Phase 2 deliverable** · 2026-07-05 · Companion to [ARCHITECTURE.md](ARCHITECTURE.md) + [SCHEMA.md](SCHEMA.md). One sprint = one approval gate = one demoable increment. The UI is already built, so every sprint is measured the same way: **which mock file dies**.

## Prerequisites (before Sprint B1)
- Firebase project created, **Blaze plan** enabled (hard requirement for Functions + Secret Manager)
- Gemini API key issued (AI Studio), billing linked → Tier 1
- `npx -y firebase-tools@latest` login; emulator suite installed
- reCAPTCHA Enterprise site key for App Check (can trail until B6 enforcement)

## Sprints

### B0 — Project scaffolding & emulators *(½ day)*
`firebase init` (Firestore, Functions TS strict, Storage, Hosting, Emulators) · `/functions` workspace (nodejs22, firebase-functions v7, firebase-admin v14, @google/genai, zod) · `firestore.rules`/`storage.rules` from SCHEMA.md · `firestore.indexes.json` · `src/lib/firebase.ts` client init behind a `VITE_USE_EMULATORS` flag · README setup section.
**Demo:** app runs unchanged against emulators. **Mock file killed:** none (foundation).

### B1 — Auth + workspace bootstrap *(Priority 1 begins)*
Email/password + Google sign-in screens (design-system styled) · route guard + `SessionContext` (user, workspace, role) · `bootstrapWorkspace` callable (idempotent: user doc + workspace + owner member doc) · deploy rules v1 **after `firebase-security-rules-auditor` pass** · Settings→Profile/Team go live.
**Demo:** real sign-up → workspace exists → Team page shows real membership. **Mocks killed:** `currentUser`, `workspace`, `teamMembers`.

### B2 — Products, Storage upload & dossier extraction ⭐ *(first Gemini call)*
Storage upload from `ProductIntakePage` (progress UI exists) · `extractDossier` callable: URL scrape / Storage read → **gemini-3.5-flash** with ProductDossier `responseSchema` → Zod validate → write dossier, flip status · `onSnapshot` products list; `processing` state drives the existing skeletons.
**Demo:** upload a real product photo → live dossier (colors/typography/voice) in `ProductDetailPage`. **Mock killed:** `products.ts` (incl. `mockExtractDossier`).
**Risk:** scraping arbitrary URLs is flaky → v1 supports og:meta + first image only; graceful `needs-review` fallback.

### B3 — Campaigns + ideation + approval *(Priority 1 complete)*
Campaigns CRUD on Firestore (existing page logic; filters/sort stay client-side) · `generateIdeas` callable (5–7, schema-constrained) → `ideas` subcollection · idea cards + approve/reject writes (rule-gated transitions) · `CreateCampaignModal` wired end-to-end (product → campaign → ideas).
**Demo:** dossier → pitched ideas → batch-approve, all persistent across refresh/devices. **Mock killed:** `campaigns.ts`.

### B4 — Generation engine ⭐ *(Priority 2 begins)*
`approveAndGenerate` callable → `generation_jobs` fan-out · `processGenerationJob` trigger: **gemini-3.1-flash-image** (Interactions API, product/brand reference images) + copy via 3.5-flash → Storage PNG + `assets` doc (`pending-review`) · job progress UI from the jobs collection (skeleton cards already exist) · retries ≤ 3, idempotent job IDs, sequential per workspace.
**Demo:** approve 3 ideas → watch real branded assets stream into the library. **Mock killed:** `assets.ts` (the derived generator — its consistency contract moves to `maintainCounters`).
**Risks:** image-model rate limits → queue is sequential + backoff; cost control → per-workspace `creditsUsed` incremented per job, checked before enqueue.

### B5 — Counters, approvals flow, notifications, dashboard
`maintainCounters` trigger (assets → campaign counts, idempotent recount) · Approvals page on `status == "pending-review"` query · asset status transitions + scheduling (`scheduledAt`) · `notifications` writes from pipeline events · dashboard KPIs/upcoming-posts from live queries.
**Demo:** the invariant proven in mock (356 ≡ Σ campaigns) now holds on live data. **Mock killed:** `mock.ts`, `settings.ts` (except plan/billing statics).

### B6 — Hardening & launch
App Check enforced (Functions → Firestore → Storage) · rules auditor re-run + emulator rules tests (`@firebase/rules-unit-testing`) for the attack checklist · Functions logging/alerting pass · Hosting deploy + preview channels · Lighthouse + bundle check (route-level code-split if > ~350 KB gz) · README finalized (setup, emulators, secrets, deploy).
**Demo:** production URL, full flow on live services.

## Dependency Spine
```
B0 → B1 → B2 → B3 → B4 → B5 → B6
             (B2 ⭐ and B4 ⭐ are the two highest-risk sprints — both touch Gemini)
```

## Risk Register

| Risk | Sprint | Mitigation |
|---|---|---|
| Gemini returns schema-invalid JSON | B2/B4 | `responseSchema` + Zod + one corrective retry → `needs-review`, never partial writes |
| Image-model rate limits / 10-min spend caps | B4 | sequential queue, exponential backoff, credits gate before enqueue |
| Rules regression exposes tenant data | B1+ | auditor pass + emulator attack tests **required before every rules deploy** |
| URL scraping unreliable | B2 | og:meta-only v1, `needs-review` fallback, image upload as primary path |
| Costs during dev | all | emulators for everything but Gemini; free-tier key for dev project |
| `functions.config()` habits from old tutorials | B0 | Secret Manager params only (decommission Mar 2027) |

## Open decisions for you (defaults applied if you just say "go")
1. **Firebase project naming** — default: `oreos-dev` + `oreos-prod` pair (dev first).
2. **Region** — default: `europe-west1` for Functions/Firestore/Storage (closest to Nairobi with full gen-2 support; `us-central1` if you prefer maximum service availability).
3. **Auth screens** — default: I design them to the existing design system (no reference image needed).
