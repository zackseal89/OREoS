# OREoS — Backend Security Review (RLS + triggers + storage)

**Adversarial pass over `supabase/migrations/0001–0004`** · 2026-07-06 · Applies the `security-and-hardening` checklist to the multi-tenant model. Status: **prototype reviewed** — the items in §3 must be re-verified against a live Postgres (pgTAP + Supabase security advisors) before production traffic.

## 1. Attacks tested → verdict

| # | Attack | Vector tested | Verdict |
|---|--------|---------------|---------|
| 1 | **Cross-tenant read** | `select` from any table for a workspace I'm not in | **BLOCKED** — every SELECT policy gates on `private.is_member(workspace_id)`; helper is `security definer` so no RLS recursion |
| 2 | **Cross-tenant write** | insert campaign/brand/product into a foreign `workspace_id` | **BLOCKED** — write policies require `is_editor(workspace_id)` of the *claimed* workspace |
| 3 | **Privilege escalation (create owner)** | owner adds a second `owner` member | **BLOCKED** — `owner add member` requires `role <> 'owner'` |
| 4 | **Privilege escalation (promote self/other to owner)** | update a member row to `role='owner'` | **BLOCKED** — `with check (role <> 'owner')` |
| 5 | **Self-escalation** | non-owner writes their own `workspace_members` row | **BLOCKED** — all member writes require `is_owner`; a non-member/editor is not an owner |
| 6 | **Ownerless workspace** | owner demotes/removes self or the workspace owner | **BLOCKED** — policies exclude `user_id = auth.uid()` and `= workspaces.owner_id` |
| 7 | **Client creates assets** | insert into `assets` | **BLOCKED** — no insert policy exists → only `service_role` (worker) writes |
| 8 | **Asset status jump to `published`** | update `assets.status` → `published` | **BLOCKED** — `assets_guard` whitelist omits `→published`; only `service_role` bypasses |
| 9 | **Asset column tamper while "editing status"** | change `storage_path`/`copy_caption` alongside `status` | **BLOCKED** — `assets_guard` rejects any change outside `status`/`scheduled_at` |
| 10 | **Idea tamper** | change idea `title`/`format` or jump `approved→generated` | **BLOCKED** — `ideas_guard` allows only `proposed→approved\|rejected`, status column only |
| 11 | **Dossier/status spoof** | client writes `products.dossier` or flips `status` | **BLOCKED** — `products_guard`: pipeline-owned on update; create forced to `processing`/null dossier |
| 12 | **Counter spoofing** | inflate campaign asset/published counts | **N/A — designed out** — counts are the `campaign_stats`/`workspace_stats` **views**, not columns; nothing to tamper |
| 13 | **Plan/credits tamper** | set `workspaces.plan='pro'` or lower `credits_used` | **BLOCKED** — `workspaces_guard` locks plan/credits/owner to `service_role` |
| 14 | **Storage cross-tenant read** | download another workspace's `generated/uploads` object | **BLOCKED** — storage SELECT policy checks `is_member(first path segment)` |
| 15 | **Storage cross-tenant write** | upload into another workspace's folder | **BLOCKED** — insert policy checks `is_member(first path segment)` |
| 16 | **Write generated assets from client** | upload to `generated` bucket | **BLOCKED** — no client write policy references `generated`; service-role only |
| 17 | **Upload-path pivot** | create a product whose `upload_path` points at another workspace | **BLOCKED** — `products_guard` requires `^{workspace_id}/`; storage RLS blocks the upload too (defense in depth) |
| 18 | **Notification tamper** | edit message text or mark-read on behalf of others | **BLOCKED** — `notifications_guard`: only append caller's own uid to `read_by` |
| 19 | **Realtime eavesdropping** | subscribe to another workspace's `workspace:{id}` channel | **BLOCKED** — `realtime.messages` SELECT policy checks membership of the topic's uuid |
| 20 | **Profile hijack** | change another user's row, or mutate own `email`/`id` | **BLOCKED** — self-only policy + `profiles_guard` immutability |

## 2. Hardening applied during this review

- **Realtime broadcast made non-fatal** (`0004`): the AFTER-trigger `broadcast_workspace_change` now wraps `realtime.broadcast_changes` in an exception handler. Rationale: an AFTER-trigger error rolls back the write that fired it — so a realtime signature/permission problem on the live instance would have silently broken *all* inserts/updates. It now degrades (logs a warning) instead of blocking writes.
- **Secrets:** confirmed `.env` is git-ignored (added this session), only `.env.example` is committed, and `GEMINI_API_KEY`/service-role never appear in the client bundle (server-only, Supabase secrets/Vault).

## 3. Residual items — MUST verify against a live Postgres before production

These cannot be proven without provisioning; they are not known holes, but unverified assumptions:

1. **`realtime.broadcast_changes` signature** — the arg order/count must match the running Supabase realtime version. (Failure is now non-fatal per §2, but realtime won't work until correct.)
2. **`net.http_post` schema** — pg_net lives in `net` on current Supabase; older projects expose it under `extensions`. Confirm before the cron tick can invoke the worker.
3. **`auth.role()`** — used by every guard to detect `service_role`. Confirm it resolves; if deprecated on the target version, swap to `(select auth.jwt() ->> 'role')`.
4. **pgTAP policy tests** — encode attacks #1–#20 above as automated tests (`@supabase/…`/pgTAP) so regressions are caught in CI.
5. **Supabase security advisors** — run after `db push`; expect and resolve any "function search_path" / "RLS disabled" advisories.

## 4. Recommended hardening (deferred, documented not implemented)

- **Cross-workspace reference integrity:** `campaigns.brand_id`/`product_id` and `assets.idea_id` are FK-valid but not asserted to share the row's `workspace_id`. RLS already blocks *reading* any foreign referenced row, so this is integrity hygiene, not a live leak. A `BEFORE INSERT OR UPDATE` guard asserting same-workspace references would close it; deferred to avoid trigger sprawl pre-provisioning.
- **`campaign_ideas.workspace_id` denormalization** is set only by the `generate-ideas` service function; a check constraint/trigger asserting it equals the parent campaign's workspace would harden against a future code bug.

## 5. Checklist status

- [x] Every table default-deny; every SELECT/write gated on membership/role
- [x] Users can only access their own workspaces' resources (tenant isolation)
- [x] Privileged columns (status, dossier, counters-as-views, plan, credits) not client-writable
- [x] Status state machines enforced (campaigns, ideas, assets)
- [x] Storage paths workspace-scoped; generated bucket write-locked
- [x] No secrets in source or git; `.env` ignored
- [x] All Gemini output Zod-validated before persistence (Edge Functions)
- [ ] pgTAP tests written *(B1/B6)*
- [ ] Security advisors run on a live project *(needs provisioning)*
