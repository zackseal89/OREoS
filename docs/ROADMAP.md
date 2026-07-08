# OREoS — Roadmap v3 (GTM-first)

**2026-07-08** · Supersedes v2 (same stack: Supabase + Gemini API). Reordered for fastest path to a marketable launch. Two structural changes from v2:

1. **Deploy early, not last.** Vercel deploy moves from B6 to Phase 0 — every sprint after it is demoable on a public URL, and auth/redirect flows get exercised against the real domain from day one.
2. **Human-in-the-loop gates are MVP scope.** OREoS is HITL by design: AI proposes, the human disposes, at every stage. The full judgment chain at launch: *AI extracts dossier → human reviews/edits → AI pitches ideas → human approves → AI generates assets → human reviews in Approvals → only then export.* The DB already enforces this via status state-machine guard triggers (`0003_triggers.sql`) — keep every new AI pipeline behind a reviewable status, never direct-to-final.

## Cut from GTM MVP (deliberate, revisit post-launch)

| Cut | Why | Replacement |
|---|---|---|
| Social OAuth publishing | Meta/TikTok app review takes weeks–months | Download assets + copy captions (approval-gated) |
| Analytics page | Meaningless without published posts | "Coming soon" state |
| Calendar, Media Library, Create Post editor, AI Studio pages | Great reference designs (`app ui/`), not needed for the core promise | Fast-follows post-launch |
| Business-first onboarding wizard (7-step brand discovery) | Product-first intake already feeds B2 | v1.1 upgrade |
| Multi-org / super-admin layer | Out of scope by decision (2026-07-08) | Single-workspace tenancy stands |

## Phases

### Phase 0 — Land the base, get public *(~1 day)*
Commit in-flight react-query work (query-key factory, `useRealtimeInvalidate`, provider) · apply `0009_notification_prefs` to live DB · regen types · Vercel deploy (SPA rewrites, `VITE_SUPABASE_*` env, Supabase auth redirect URLs for the production domain) · verify signup round-trip on the real domain.
**Demo:** the current app, live on a shareable URL.

### Phase 1 — First magic moment (B2: dossier extraction) ⭐ *(~2–3 days, highest technical risk — goes first)*
`ProductIntakePage` → `uploads` bucket / URL → `extract-dossier` Edge Function: **gemini-3.5-flash** with ProductDossier `responseSchema`; URL path uses the `url_context` tool → Zod validate → service-role write → live dossier in `ProductDetailPage`.
**HITL gate:** user reviews and can edit the dossier before it becomes generation ground truth — extraction output is never silently accepted. (Also replaces the temporary `bootstrapBrandIfNeeded` demo seed.)
**Demo:** stranger signs up on the public URL, pastes a product URL, sees a real AI brand dossier, edits it. **Mock killed:** `products.ts`.

### Phase 2 — Ideas + approval (B3) *(~2 days)*
Campaign CRUD against Postgres (page logic exists) · `generate-ideas` → `campaign_ideas` rows → idea cards → batch approve/reject constrained by `ideas_guard` · `CreateCampaignModal` wired end-to-end.
**HITL gate:** nothing generates until ideas are explicitly approved.
**Demo:** dossier → 5–7 idea cards → approval, persistent across devices. **Mock killed:** `campaigns.ts`.

### Phase 3 — Generation engine + Approvals (B4) ⭐ *(~3–4 days)*
Approve → credit check → `generation_jobs` + `pgmq.send` fan-out · cron tick → `generation-worker`: **gemini-3.1-flash-image** (product/brand reference images) + 3.5-flash copy → `generated` bucket + `assets` rows in **`pending-review`** · progress UI via broadcast (`useRealtimeInvalidate`) · retries via visibility timeout, `attempts ≤ 3`, idempotency on `(campaign, idea, format)`.
**HITL gate:** Approvals page goes live in this phase (elevated from v2's B5) — assets land in `pending-review`; **download/export/copy-caption is gated on `approved`**.
**Demo:** approve 3 ideas → watch branded assets stream in → review in Approvals → export. **Mock killed:** `assets.ts`.

### Phase 4 — Launch wrap *(~2–3 days)*
Dashboard/notifications fully live + credits gate with upgrade CTA · landing page polish to the `app ui/` reference + Google OAuth (biggest signup-conversion lever) · hardening: security advisors, pgTAP cross-tenant/role-escalation/status-jump tests, Edge Function rate limits & logging · README finalized.
**Demo:** production URL, full HITL loop on live services → **launch**.

## Risk register

| Risk | Phase | Mitigation |
|---|---|---|
| Schema-invalid Gemini JSON | 1/3 | `responseSchema` + Zod + one corrective retry → `needs-review`; never partial writes |
| Image-model rate limits / spend | 3 | pgmq sequential worker, visibility-timeout retries, credits gate before enqueue |
| RLS gap leaks tenant data | all | pgTAP policy tests + security advisors every phase; guard triggers |
| Edge Function wall-clock limit | 3 | ≤ 1 image per invocation; cron fans out |
| `url_context` fails on odd storefronts | 1 | fallback prompt-only extraction → `needs-review`; image upload remains primary |
| Auth redirect breakage on prod domain | 0 | deploy first, verify signup round-trip before building on top |

**Estimated total: ~2–2.5 weeks** of focused work to a marketable product.
