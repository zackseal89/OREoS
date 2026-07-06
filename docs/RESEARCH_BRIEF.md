# Research Brief — AI Brand Campaign Studio ("ADstudio")

**Phase 1 deliverable** · Researched against live Google documentation on 2026-07-05.
All versions and model names below were verified against current docs, npm, and the official Firebase Agent Skills installed in this workspace — **not** training data.

---

## 1. Verified Stack & Versions

| Layer | Package / Service | Verified Version | Notes |
|---|---|---|---|
| Frontend SDK | `firebase` (Web, modular) | **v12.x** (12.15.0 current) | Modular tree-shakeable API is the only recommended pattern; namespaced/compat API is legacy |
| Functions SDK | `firebase-functions` | **v7.x** (7.2.5 current) | 2nd gen is the default; import from `firebase-functions/v2/*` |
| Admin SDK | `firebase-admin` | **v14.x** (14.1.0 current) | Requires **Node 22+** (Node 18/20 support deprecated in Admin SDK) |
| Functions runtime | Cloud Functions for Firebase (2nd gen, on Cloud Run) | **`nodejs22`** | Node 20 & 22 fully supported; Node 18 deprecated early 2025 |
| CLI | `firebase-tools` | latest via `npx -y firebase-tools@latest` | Official agent-skill mandate: never use a globally pinned `firebase` binary |
| AI SDK (server) | `@google/genai` (Google GenAI SDK) | **v2.10.0** | The old `@google/generative-ai` package is deprecated — do not use |
| Hosting | Firebase Hosting (classic) | n/a | Correct choice for a Vite SPA. Firebase **App Hosting** is only needed for SSR frameworks (Next.js/Angular) — not us |

---

## 2. Gemini API — Current State (major changes vs. training data)

### 2.1 Model lineup (verified 2026-07)

**Shut down / do not use:** `gemini-2.0-flash`, `gemini-2.0-flash-lite`, `gemini-3-pro`, Imagen 4 (deprecated). Any architecture referencing Gemini 1.x/2.0 is dead on arrival.

**Text / multimodal analysis (image + text in):**
| Model ID | Status | Use for us |
|---|---|---|
| `gemini-3.5-flash` | **Stable** — flagship workhorse, 1M context, image input, structured output | **Extraction (brand dossier) + Ideation + Copywriting** |
| `gemini-3.1-flash-lite` | Stable, cheapest frontier-class | Fallback / cost-optimization lever |
| `gemini-3.1-pro-preview` | Preview, reasoning-first | Not for production (preview) |
| `gemini-2.5-flash` / `-pro` | Stable but legacy generation | Fallback only |

**Image generation ("Nano Banana" family — all via the Interactions API):**
| Model ID | Marketing name | Use for us |
|---|---|---|
| `gemini-3.1-flash-image` | Nano Banana 2 | **Default for asset generation** — 4K, up to 14 reference images (ideal for brand-consistent composition) |
| `gemini-3.1-flash-lite-image` | Nano Banana Lite | Cheap/fast drafts (1K only) |
| `gemini-3-pro-image` | Nano Banana Pro | Premium tier for complex visual production |
| `gemini-2.5-flash-image` | legacy | Avoid |

### 2.2 Two APIs now exist — decision required (recommendation below)

- **`generateContent`** — the classic API. Officially **"legacy but fully supported"** and explicitly *"the recommended path for stable production deployments"*; also the only path to the Batch API and explicit caching.
- **Interactions API** (`ai.interactions.create`, SDK ≥ 2.3.0) — the new primitive for agentic/multi-turn work with server-side conversation state; **required** by the docs' current examples for the Nano Banana image models.

**Recommendation:** `generateContent` with `responseSchema` for the deterministic JSON pipelines (extraction, ideation, copy), Interactions API for image generation. Both live in the same `@google/genai` client, so this costs nothing architecturally.

### 2.3 Structured output (critical for our pipeline)

Current pattern: pass a JSON Schema and get schema-conforming JSON back — no prompt-begging for JSON:

```ts
// Interactions API style (current docs)
const interaction = await ai.interactions.create({
  model: "gemini-3.5-flash",
  input: [...multimodal parts...],
  response_format: { type: "text", mime_type: "application/json", schema: dossierJsonSchema },
});
// generateContent style: config: { responseMimeType: "application/json", responseSchema }
```

Docs pair this with **Zod v4's `z.fromJSONSchema()`** for runtime validation — we will validate every Gemini response server-side before writing to Firestore.

### 2.4 Multimodal input limits

- Inline base64 image input is capped at **~20 MB request size** (HTTP 413 beyond that). Our flow: client uploads to **Cloud Storage first**, the Cloud Function reads the bytes (or passes a Files-API/Storage reference) — never inline uploads from the browser to Gemini.

### 2.5 Rate limits & pricing tiers (verified)

- **Free tier** exists (no billing) — fine for early dev.
- **Tier 1** (billing linked): $10 spend cap per rolling 10-min window; **Tier 2** ($100+ spent, 3 days): $200/10-min; **Tier 3** ($1,000+, 30 days). Free→Tier 1 upgrade is instant when billing is enabled.
- Limits are per-model; image models have materially lower throughput than `gemini-3.5-flash`. Generation step must therefore be **queued/sequential per user**, not fan-out-parallel.

---

## 3. Firebase — Current State

### 3.1 Cloud Functions 2nd gen (the only gen we'll write)

- Import style: `firebase-functions/v2/https` (`onCall`), `/v2/firestore` (`onDocumentCreated`), etc.
- **Callable functions (`onCall`) are the right primitive** for our UI-triggered pipeline: built-in auth context (`request.auth`), App Check enforcement (`enforceAppCheck: true`, optional `consumeAppCheckToken` replay protection), and CORS handled for you.
- **⚠️ Breaking change:** `functions.config()` is **deprecated and will be decommissioned March 2027** — deployments using it will fail. Secrets must use **Cloud Secret Manager** via params:

```ts
import { defineSecret } from "firebase-functions/params";
const geminiApiKey = defineSecret("GEMINI_API_KEY");   // set with: firebase functions:secrets:set GEMINI_API_KEY

export const extractBrand = onCall({ secrets: [geminiApiKey], enforceAppCheck: true }, async (req) => {
  const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });
  ...
});
```

- Cloud Functions + Secret Manager require the **Blaze (pay-as-you-go) plan**. This is a hard prerequisite for Phase 3.
- 2nd gen runs on Cloud Run under a per-function service account — we'll scope IAM minimally in Phase 2.

### 3.2 Firestore — new decision point: **edition**

Firestore now ships in two editions; the official agent skill requires choosing before any data modeling:
- **Standard** — classic Firestore: mature Security Rules, full emulator support, the well-trodden path for rules-secured multi-tenant web apps.
- **Enterprise** — newer edition (MongoDB-compatible API, server-side pipelines/joins, native full-text search); the official skill defaults new databases to Enterprise.

**Recommendation (to confirm at Phase 2 kickoff):** **Standard edition.** Our access pattern is simple owner-scoped documents secured by Security Rules and consumed via client `onSnapshot` listeners — exactly Standard's sweet spot, with the most mature rules/emulator tooling. Enterprise's pipelines/search add nothing we need for v1.

### 3.3 Security Rules (source: official `firebase-firestore` + `firebase-security-rules-auditor` skills)

The official skills mandate a stricter bar than the public docs' samples. Our Phase 2 rules will follow their required pattern:
- **Default deny**, ownership via `request.auth.uid == resource.data.ownerUid`, and **UID immutability** on update.
- **Validator-function pattern**: every `create` **and** `update` calls an `isValidX()` domain validator — type checks, `hasOnly()` strict schema (no extraneous fields), **size limits on every string/list** (unbounded strings = 1MB-write DoS), enum + state-transition validation (e.g., `campaign_ideas.status: proposed → approved → generated`).
- **No mixed content**: any doc with PII (users' email) is owner-read-only.
- Storage rules will validate **path scoping (`users/{uid}/…`), content type (`image/*`), and max file size** on upload.
- The `firebase-security-rules-auditor` skill will be run against the rules ("devil's advocate" attack checklist) before every rules deploy.

### 3.4 Firebase AI Logic — evaluated and rejected (documented deliberately)

Firebase now offers **AI Logic** (ex-"Vertex AI for Firebase"): calling Gemini directly from the client SDK, protected by App Check. It's the official low-friction path — but it conflicts with our non-negotiables: our Gemini calls do multi-step server-side orchestration (scrape → analyze → validate → persist) and must be idempotent and quota-controlled per user. **Decision: server-side `@google/genai` inside Cloud Functions**, per the mandate. We still adopt AI Logic's security guidance: **App Check on all entry points**.

### 3.5 Hosting & Auth

- **Firebase Hosting (classic)** for the Vite SPA: `firebase init hosting` → `dist/`, SPA rewrite to `/index.html`. App Hosting explicitly not needed (no SSR).
- **Firebase Auth**: Email/password + Google provider are both current, fully supported in the v12 modular SDK (`signInWithPopup(new GoogleAuthProvider())`). Auth state via `onAuthStateChanged`; Firestore rules key off `request.auth.uid`.

---

## 4. Gotchas Register (things that would have bitten us)

1. **Gemini 2.0 models are shut down** — any older tutorial/sample referencing them fails at runtime.
2. **`@google/generative-ai` npm package is deprecated** — the correct SDK is `@google/genai`.
3. **`functions.config()` decommissioned March 2027** — Secret Manager params from day one.
4. **Nano Banana image models are called via the Interactions API** in current docs — not classic `generateContent`.
5. **`firebase-admin` v14 wants Node 22+** — functions runtime must be pinned `nodejs22`, matching engines in `functions/package.json`.
6. **20 MB inline-data ceiling** on multimodal requests — always route product images through Cloud Storage.
7. **Blaze plan required** before Cloud Functions/Secret Manager deploys — setup prerequisite, must be in README.
8. **Firestore edition choice is now mandatory at provisioning** — silent default differs by tool (skill defaults to Enterprise; we recommend Standard).
9. **Rolling 10-minute spend caps** on Gemini tiers — batch generation must be throttled/queued, informing the Phase 2 generation-engine design.
10. **Callable functions ≠ idempotent by default** — Phase 2 design gives every pipeline stage an idempotency key (deterministic doc IDs + status-gated writes).

## 5. Open Decisions for Phase 2 (will present, not guess)

1. **Firestore edition** — recommended: Standard (rationale §3.2).
2. **State management** — React Context + `onSnapshot` is sufficient (Firestore is already our store); Zustand only if prop-drilling pain appears. No official doc mandates either.
3. **App Check enrollment timing** — architecture includes it from day one; enforcement can be toggled after reCAPTCHA Enterprise setup.

## 6. Citations

**Firebase**
- Functions 2nd gen get started — https://firebase.google.com/docs/functions/get-started?gen=2nd
- Environment config / secrets / `functions.config()` deprecation — https://firebase.google.com/docs/functions/config-env
- 1st→2nd gen upgrade — https://firebase.google.com/docs/functions/2nd-gen-upgrade
- App Check for callable functions — https://firebase.google.com/docs/app-check/cloud-functions
- Web SDK setup (modular) — https://firebase.google.com/docs/web/setup · release notes: https://firebase.google.com/support/release-notes/js
- Rules conditions & insecure-rules guide — https://firebase.google.com/docs/firestore/security/rules-conditions · https://firebase.google.com/docs/rules/insecure-rules
- Firebase AI Logic — https://firebase.google.com/docs/ai-logic/get-started · models: https://firebase.google.com/docs/ai-logic/models
- Hosting — https://firebase.google.com/docs/hosting
- npm: https://www.npmjs.com/package/firebase-functions · https://www.npmjs.com/package/firebase-admin · https://www.npmjs.com/package/firebase

---

## Addendum (2026-07-05): Stack amendment & Managed Agents

- **Backend amended by owner decision: Supabase (Postgres/RLS/Edge Functions/Storage) replaces Firebase.** §3 of this brief is superseded by the archived plan in `archive/firebase-plan/`; all Gemini findings (§2) remain in force. Supabase specifics were verified separately (multi-tenant RLS via `security definer` helpers; pgmq + pg_cron worker pattern; broadcast-from-DB realtime — `postgres_changes` discouraged for new apps; Edge Function wall-clock limits).
- **Gemini Managed Agents** (new since original brief): server-side agent harness on base `antigravity-preview-05-2026`, created via `agents.create()` (instructions, code-exec/search/`url_context`, MCP, function calling), invoked by ID via Interactions API; supports `background=true` and `previous_interaction_id` state. **Preview**; 1 base agent, no versioning, ≤ 1,000 agents/account. Verdict: not for the v1 deterministic pipeline; earmarked for AI Chat / AI Recommendations in v2. The **`url_context` tool, usable with plain `generateContent`**, is adopted immediately for URL ingestion (replaces manual scraping).
  - Managed Agents guide — https://ai.google.dev/gemini-api/docs/custom-agents
  - Agents overview — https://ai.google.dev/gemini-api/docs/agents
  - Interactions API GA announcement — https://blog.google/innovation-and-ai/technology/developers-tools/interactions-api-general-availability/
  - Managed Agents announcement — https://blog.google/innovation-and-ai/technology/developers-tools/managed-agents-gemini-api/

**Gemini API**
- Models catalog — https://ai.google.dev/gemini-api/docs/models
- Gemini 3 developer guide — https://ai.google.dev/gemini-api/docs/gemini-3
- Interactions API overview — https://ai.google.dev/gemini-api/docs/interactions-overview · migration guidance: https://ai.google.dev/gemini-api/docs/interactions
- Structured output — https://ai.google.dev/gemini-api/docs/structured-output
- Image generation (Nano Banana) — https://ai.google.dev/gemini-api/docs/image-generation
- Rate limits & tiers — https://ai.google.dev/gemini-api/docs/rate-limits
- Libraries / SDK migration — https://ai.google.dev/gemini-api/docs/libraries · https://ai.google.dev/gemini-api/docs/migrate
- npm: https://www.npmjs.com/package/@google/genai

**Official Firebase Agent Skills (installed in this workspace, consulted directly)**
- `.claude/skills/firebase-firestore/` (edition selection + security-rules methodology)
- `.claude/skills/firebase-ai-logic-basics/` (AI Logic evaluation, App Check requirement, model-name warnings)
- `.claude/skills/firebase-basics/` (CLI workflow: `npx -y firebase-tools@latest`)
