# OREoS — Backend Provisioning Runbook

Exact steps to stand up the Supabase backend from this repo. Tailored to our migrations (`supabase/migrations/0001–0004`) and Edge Functions. Do these in order.

## 0. Install the CLI & log in

```bash
npm i -g supabase          # or use `npx supabase ...` everywhere below
supabase login             # opens a browser to authorize
```

## 1. Create the project

Create it in the dashboard (https://supabase.com/dashboard → New project) **or** the CLI.
- **Region:** pick the one closest to your users. For Nairobi, **`eu-central-1` (Frankfurt)** is the lowest-latency Supabase region; `eu-west-2` (London) is a close second.
- **DB password:** save it in your password manager.
- Free tier is fine for all dev through Sprint B3.

Grab the **project ref** (the `abcd…` in the project URL) for the next step.

## 2. Enable required extensions (before pushing migrations)

Migration `0004` runs `create extension … pgmq / pg_net / pg_cron`. On most projects `create extension if not exists` just works during `db push`. If it errors, pre-enable them:

Dashboard → **Database → Extensions**, toggle on: `pgmq`, `pg_net`, `pg_cron`. (Vault is enabled by default.)

## 3. Link & apply migrations

```bash
cd <repo>
supabase link --project-ref <your-ref>
supabase db push            # applies 0001 → 0004 in order
```

Expect: 10 tables, 2 views, RLS on every table, guard triggers, the pgmq queue, 3 storage buckets, broadcast triggers, and the cron job `oreos-generation-tick`.

## 4. Run the security advisors (verifies §3 of SECURITY_REVIEW.md)

```bash
supabase inspect db          # general health
```
Then in the dashboard → **Advisors → Security**. Resolve anything flagged (expect possible "function search_path mutable" notes — our functions already pin `search_path=''`, so these should be clean).

Spot-check the three items the review couldn't verify offline:
- `select 1 from pg_proc where proname='broadcast_changes';` (realtime helper exists)
- `select extnamespace::regnamespace from pg_extension where extname='pg_net';` — confirm it's `net` (if `extensions`, update the `net.http_post` call in `0004`).
- `select auth.role();` returns a value (guards depend on it).

## 5. Wire the generation pipeline secrets (needed for Sprint B4, not before)

The cron tick reads these from Vault to call the worker. In the SQL editor:

```sql
select vault.create_secret('https://<your-ref>.supabase.co', 'project_url');
select vault.create_secret('<service_role_key>', 'service_role_key');
```
(Service-role key: Dashboard → Project Settings → API. **Never** put this in the client `.env`.)

## 6. Edge Function secrets & deploy

```bash
supabase secrets set GEMINI_API_KEY=<your-gemini-key>
supabase functions deploy    # deploys extract-dossier, generate-ideas, generation-worker
```

## 7. Generate typed DB types for the frontend

```bash
supabase gen types typescript --linked > src/types/database.ts
```
Then flip `src/lib/supabase.ts` to `createClient<Database>(...)` (there's a TODO marker there).

## 8. Point the app at the project

```bash
cp .env.example .env
# VITE_SUPABASE_URL=https://<your-ref>.supabase.co
# VITE_SUPABASE_PUBLISHABLE_KEY=<anon/publishable key>
npm run dev
```

## 9. (Optional) Google sign-in

Set `SUPABASE_AUTH_GOOGLE_CLIENT_ID` / `SUPABASE_AUTH_GOOGLE_SECRET`, flip `enabled = true` under `[auth.external.google]` in `config.toml`, and add the callback URL in the Google Cloud console.

---

**When you've done steps 1–3 (and ideally 7):** tell me, and I'll start **Sprint B1** — auth screens + `SessionContext` + swapping the first mock (`currentUser`/`workspace`/`teamMembers`) for live queries. I can build the auth UI now against the design system even before you provision, if you'd like it waiting.
