# OREoS — Firestore Schema & Security Rules (draft)

**Phase 2 deliverable** · 2026-07-05 · Field shapes mirror `src/types/index.ts` so Phase 3 wiring is mechanical (mock arrays → collections).

## 1. Collection Tree

```
users/{uid}                                    ← private profile (PII: owner-only)
workspaces/{wsId}
├── members/{uid}                              ← membership + role (tenancy backbone)
├── brands/{brandId}
├── products/{productId}                       ← dossier embedded as map
├── campaigns/{campaignId}
│   └── ideas/{ideaId}                         ← proposed → approved → generated
├── assets/{assetId}                           ← flat: library queries across campaigns
├── generation_jobs/{jobId}                    ← client-readable, function-writable
└── notifications/{notificationId}             ← function-writable, member-readable
```

## 2. Documents

### `users/{uid}` — owner read/write only (contains email)
| Field | Type | Notes |
|---|---|---|
| `name` | string 1–80 | |
| `email` | string, email regex | immutable after create (matches auth token) |
| `timezone` | string ≤ 60 | e.g. `Africa/Nairobi` |
| `workspaceIds` | string[] ≤ 20 | denormalized for workspace switcher |
| `createdAt` | timestamp | immutable, `isRecent()` on create |

### `workspaces/{wsId}` — member read; owner update
`name` (string 1–60) · `slug` (string 1–40, `[a-z0-9-]`) · `logoUrl` (https URL ≤ 500) · `defaultBrandVoice` (string ≤ 80) · `ownerUid` (immutable) · `plan` (enum: `trial|pro`) · `creditsUsed`/`creditsTotal` (int ≥ 0, **function-write only**) · `createdAt` (immutable)

### `workspaces/{wsId}/members/{uid}` — member read; owner create/delete
| Field | Type | Notes |
|---|---|---|
| `role` | enum `owner\|editor\|viewer` | == UI `TeamRole`. **Rules:** only an owner writes member docs; an owner cannot demote/delete themselves (prevents ownerless workspace); invited-but-unregistered people live in an `invites` map on the workspace doc, not here |
| `name`, `email` | strings | denormalized for Team UI |
| `addedAt` | timestamp | immutable |

### `workspaces/{wsId}/brands/{brandId}` — member read; editor+ write
Mirrors `Brand`: `name`, `logoUrl`, `industry`, `colors` (string[] ≤ 8, each `^#[0-9A-Fa-f]{6}$`), `typographyHeadline` ≤ 120, `voiceSummary` ≤ 600, `createdAt`/`updatedAt`.

### `workspaces/{wsId}/products/{productId}` — member read; editor+ create; **dossier/status function-only**
| Field | Type | Notes |
|---|---|---|
| `name`, `brand`, `category` | strings ≤ 120 | client-writable |
| `sourceType` | enum `url\|upload` | immutable |
| `sourceUrl` | https URL ≤ 800 | optional |
| `uploadPath` | string, must match `ws/{wsId}/uploads/…` | path-scoping check |
| `status` | enum `processing\|ready\|needs-review` | **written only by `extractDossier`** (client sets `processing` on create only) |
| `dossier` | map (mirrors `ProductDossier`) | **function-write only**; `colors[]` ≤ 8 hex, `valueProps[]` ≤ 8 × ≤ 200 chars, `voiceSummary` ≤ 600, `assetUrls[]` ≤ 10 https |
| `linkedCampaigns` | int ≥ 0 | counter, function-write only |
| `createdAt`/`updatedAt` | timestamps | `createdAt` immutable |

### `workspaces/{wsId}/campaigns/{campaignId}` — member read; editor+ write (fields below)
Mirrors `Campaign`: `name` 1–100 · `description` ≤ 300 · `status` enum `draft|active|completed|paused|archived` with **transition validation** (`draft→active`, `active→paused|completed|archived`, `paused→active|archived`, `completed→archived`; no resurrecting archived) · `platforms` (≤ 4, each in enum) · `brandId`, `productId` (must reference same workspace) · `tags` ≤ 10 × ≤ 24 chars · `owner` (uid, immutable) · `startAt`/`endAt` timestamps · `createdAt` immutable, `updatedAt` `isRecent()` · **counters `assets`, `scheduled`, `published`, `reachK`, `engagementPct`: function-write only** (`maintainCounters`) — clients may never touch them (kills count-spoofing).

### `workspaces/{wsId}/campaigns/{id}/ideas/{ideaId}` — member read; created by `generateIdeas`; client may **only** flip status
`title` ≤ 120 · `description` ≤ 500 · `format` enum (`image|video|carousel|story`) · `platforms[]` · `rationale` ≤ 300 · `status` enum `proposed|approved|rejected|generated` — client update rule allows **exactly** `status` change `proposed→approved|rejected` and nothing else (`affectedKeys().hasOnly(['status'])`); `generated` is function-only.

### `workspaces/{wsId}/assets/{assetId}` — member read; editor+ may update status/delete; **create is function-only**
Mirrors `Asset`: `name` ≤ 160 · `type` enum · `status` enum `draft|pending-review|approved|scheduled|published` with transitions (`draft→pending-review`, `pending-review→approved|draft`, `approved→scheduled|pending-review`, `scheduled→published|approved`; client can never jump to `published` — that's the publisher function) · `campaignId` + denormalized `campaignName` · `product` · `platform` enum · `storagePath` (must match `ws/{wsId}/assets/…`) · `thumbnailUrl` https · `sizeLabel` ≤ 12 · `durationSec` int 0–600 optional · `scheduledAt` timestamp optional · `tags` ≤ 10 × ≤ 24 · `createdAt` immutable.

### `workspaces/{wsId}/generation_jobs/{jobId}` — member read (progress UI); **all writes function-only**
`jobId` = `{campaignId}_{ideaId}_{format}` (idempotency key). Fields: `status` enum `queued|running|succeeded|failed`, `ideaId`, `campaignId`, `attempts` ≤ 3, `error` ≤ 500, `createdAt`, `finishedAt`. TTL cleanup after 30 days (post-v1).

### `workspaces/{wsId}/notifications/{id}` — member read + mark-read; create function-only
`kind` enum `success|warning|ai|info` (== UI) · `message` ≤ 300 · `readBy` uid[] (client may only append own uid) · `createdAt`.

## 3. Composite Indexes (`firestore.indexes.json`)

Single-field indexes are automatic; these cover the shipped UI's filter+sort combos:

| Collection group | Fields | Serves |
|---|---|---|
| `assets` | `campaignId ASC, createdAt DESC` | campaign workspace assets tab, deep-link view |
| `assets` | `status ASC, createdAt DESC` | Approvals queue, status filter |
| `assets` | `type ASC, createdAt DESC` | library type tabs |
| `assets` | `status ASC, scheduledAt ASC` | dashboard "Upcoming Posts", future Calendar |
| `campaigns` | `status ASC, updatedAt DESC` | campaigns tabs + "Recent" sort |
| `generation_jobs` | `status ASC, createdAt ASC` | queue processor + progress UI |
| `notifications` | `createdAt DESC` | automatic (single-field) — listed for completeness only |

Combined filters beyond these (e.g. type+status+platform) stay client-side over the workspace's own assets — same as today's mock filtering; revisit only if a workspace exceeds ~5k assets.

**Exemptions:** `dossier` map and `assetUrls` (large, never filtered on) exempted from auto-indexing.

## 4. Draft `firestore.rules`

> ⚠️ **Prototype status.** These rules are designed to be secure — default-deny, membership+role gates, full validator-function pattern with size limits and immutable fields. Per the security-rules methodology, they must still go through the `firebase-security-rules-auditor` devil's-advocate pass and emulator tests in Phase 3 **before any deploy**, and you should review them before broadly sharing the app.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ---------- helpers ----------
    function isAuthed() { return request.auth != null; }

    function memberDoc(wsId) {
      return get(/databases/$(database)/documents/workspaces/$(wsId)/members/$(request.auth.uid));
    }
    function isMember(wsId) {
      return isAuthed()
        && exists(/databases/$(database)/documents/workspaces/$(wsId)/members/$(request.auth.uid));
    }
    function role(wsId) { return memberDoc(wsId).data.role; }
    function isOwner(wsId)  { return isMember(wsId) && role(wsId) == 'owner'; }
    function isEditor(wsId) { return isMember(wsId) && role(wsId) in ['owner', 'editor']; }

    function hasOnly(fields) { return request.resource.data.keys().hasOnly(fields); }
    function str(f, min, max) {
      return request.resource.data[f] is string
        && request.resource.data[f].size() >= min
        && request.resource.data[f].size() <= max;
    }
    function unchanged(fields) {
      return !request.resource.data.diff(resource.data).affectedKeys().hasAny(fields);
    }
    function isRecent(t) {
      return t is timestamp && t > request.time - duration.value(5, 'm') && t <= request.time;
    }
    function httpsUrl(f, max) {
      return request.resource.data[f] is string
        && request.resource.data[f].size() <= max
        && request.resource.data[f].matches('^https://.*');
    }

    // ---------- users (PII: strictly owner-only) ----------
    match /users/{uid} {
      function isValidUser() {
        return hasOnly(['name', 'email', 'timezone', 'workspaceIds', 'createdAt'])
          && str('name', 1, 80)
          && request.resource.data.email == request.auth.token.email
          && str('timezone', 1, 60)
          && request.resource.data.workspaceIds is list
          && request.resource.data.workspaceIds.size() <= 20;
      }
      allow read: if isAuthed() && request.auth.uid == uid;
      allow create: if isAuthed() && request.auth.uid == uid
        && isValidUser() && isRecent(request.resource.data.createdAt);
      allow update: if isAuthed() && request.auth.uid == uid
        && isValidUser() && unchanged(['email', 'createdAt']);
      allow delete: if false;
    }

    match /workspaces/{wsId} {
      function isValidWorkspace() {
        return hasOnly(['name','slug','logoUrl','defaultBrandVoice','ownerUid',
                        'plan','creditsUsed','creditsTotal','createdAt'])
          && str('name', 1, 60)
          && str('slug', 1, 40) && request.resource.data.slug.matches('^[a-z0-9-]+$')
          && httpsUrl('logoUrl', 500)
          && str('defaultBrandVoice', 0, 80)
          && request.resource.data.plan in ['trial', 'pro'];
      }
      // creation goes through the bootstrapWorkspace callable (Admin SDK) only
      allow read: if isMember(wsId);
      allow create: if false;
      allow update: if isOwner(wsId) && isValidWorkspace()
        && unchanged(['ownerUid', 'createdAt', 'plan', 'creditsUsed', 'creditsTotal']);
      allow delete: if false; // v1: deletion is a support/console operation

      // ---------- members ----------
      match /members/{memberUid} {
        function isValidMember() {
          return hasOnly(['role', 'name', 'email', 'addedAt'])
            && request.resource.data.role in ['owner', 'editor', 'viewer']
            && str('name', 1, 80) && str('email', 3, 200);
        }
        allow read: if isMember(wsId);
        // owners manage members; nobody edits their own role; the workspace
        // ownerUid's member doc is untouchable (no ownerless workspaces)
        allow create: if isOwner(wsId) && isValidMember()
          && memberUid != request.auth.uid
          && request.resource.data.role != 'owner';
        allow update: if isOwner(wsId) && isValidMember()
          && memberUid != request.auth.uid
          && memberUid != get(/databases/$(database)/documents/workspaces/$(wsId)).data.ownerUid
          && unchanged(['addedAt', 'email']);
        allow delete: if isOwner(wsId)
          && memberUid != request.auth.uid
          && memberUid != get(/databases/$(database)/documents/workspaces/$(wsId)).data.ownerUid;
      }

      // ---------- brands ----------
      match /brands/{brandId} {
        function isValidBrand() {
          return hasOnly(['name','logoUrl','industry','colors','typographyHeadline',
                          'voiceSummary','createdAt','updatedAt'])
            && str('name', 1, 80) && str('industry', 0, 60)
            && httpsUrl('logoUrl', 500)
            && request.resource.data.colors is list
            && request.resource.data.colors.size() <= 8
            && str('typographyHeadline', 0, 120)
            && str('voiceSummary', 0, 600)
            && isRecent(request.resource.data.updatedAt);
        }
        allow read: if isMember(wsId);
        allow create: if isEditor(wsId) && isValidBrand()
          && isRecent(request.resource.data.createdAt);
        allow update: if isEditor(wsId) && isValidBrand() && unchanged(['createdAt']);
        allow delete: if isOwner(wsId);
      }

      // ---------- products ----------
      match /products/{productId} {
        function isValidProductCreate() {
          return hasOnly(['name','brand','category','sourceType','sourceUrl','uploadPath',
                          'status','linkedCampaigns','createdAt','updatedAt'])
            && str('name', 1, 120) && str('brand', 1, 120) && str('category', 0, 60)
            && request.resource.data.sourceType in ['url', 'upload']
            && (!('sourceUrl' in request.resource.data) || httpsUrl('sourceUrl', 800))
            && (!('uploadPath' in request.resource.data)
                || request.resource.data.uploadPath.matches('^ws/' + wsId + '/uploads/.*'))
            && request.resource.data.status == 'processing'   // only entry state
            && request.resource.data.linkedCampaigns == 0;
        }
        allow read: if isMember(wsId);
        allow create: if isEditor(wsId) && isValidProductCreate()
          && isRecent(request.resource.data.createdAt);
        // dossier, status, counters: Admin SDK only
        allow update: if isEditor(wsId)
          && unchanged(['dossier','status','sourceType','linkedCampaigns','createdAt'])
          && str('name', 1, 120) && str('brand', 1, 120) && str('category', 0, 60)
          && isRecent(request.resource.data.updatedAt);
        allow delete: if isEditor(wsId);
      }

      // ---------- campaigns ----------
      match /campaigns/{campaignId} {
        function validStatus(s) {
          return s in ['draft','active','completed','paused','archived'];
        }
        function validTransition() {
          let prev = resource.data.status;
          let next = request.resource.data.status;
          return prev == next
            || (prev == 'draft'     && next in ['active','archived'])
            || (prev == 'active'    && next in ['paused','completed','archived'])
            || (prev == 'paused'    && next in ['active','archived'])
            || (prev == 'completed' && next == 'archived');
        }
        function isValidCampaign() {
          return hasOnly(['name','description','status','platforms','brandId','productId',
                          'tags','owner','startAt','endAt','assets','scheduled','published',
                          'reachK','engagementPct','createdAt','updatedAt'])
            && str('name', 1, 100) && str('description', 0, 300)
            && validStatus(request.resource.data.status)
            && request.resource.data.platforms is list
            && request.resource.data.platforms.size() <= 4
            && request.resource.data.tags is list
            && request.resource.data.tags.size() <= 10
            && isRecent(request.resource.data.updatedAt);
        }
        allow read: if isMember(wsId);
        allow create: if isEditor(wsId) && isValidCampaign()
          && request.resource.data.status == 'draft'
          && request.resource.data.owner == request.auth.uid
          && request.resource.data.assets == 0
          && request.resource.data.scheduled == 0
          && request.resource.data.published == 0
          && isRecent(request.resource.data.createdAt);
        allow update: if isEditor(wsId) && isValidCampaign() && validTransition()
          && unchanged(['owner','createdAt','assets','scheduled','published',
                        'reachK','engagementPct']);   // counters are function-only
        allow delete: if isOwner(wsId);

        // ---------- ideas ----------
        match /ideas/{ideaId} {
          allow read: if isMember(wsId);
          allow create: if false;                      // generateIdeas (Admin SDK) only
          // clients may do exactly one thing: approve or reject a proposal
          allow update: if isEditor(wsId)
            && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status'])
            && resource.data.status == 'proposed'
            && request.resource.data.status in ['approved', 'rejected'];
          allow delete: if false;
        }
      }

      // ---------- assets ----------
      match /assets/{assetId} {
        function validAssetTransition() {
          let prev = resource.data.status;
          let next = request.resource.data.status;
          return (prev == 'draft'          && next == 'pending-review')
            || (prev == 'pending-review'   && next in ['approved', 'draft'])
            || (prev == 'approved'         && next in ['scheduled', 'pending-review'])
            || (prev == 'scheduled'        && next == 'approved');
          // 'published' is reachable only via the Admin SDK (publisher)
        }
        allow read: if isMember(wsId);
        allow create: if false;                        // generation pipeline only
        allow update: if isEditor(wsId)
          && request.resource.data.diff(resource.data).affectedKeys()
               .hasOnly(['status', 'scheduledAt'])
          && validAssetTransition()
          && (!('scheduledAt' in request.resource.data)
              || request.resource.data.scheduledAt is timestamp);
        allow delete: if isEditor(wsId);
      }

      // ---------- generation jobs (read-only progress) ----------
      match /generation_jobs/{jobId} {
        allow read: if isMember(wsId);
        allow write: if false;
      }

      // ---------- notifications ----------
      match /notifications/{notificationId} {
        allow read: if isMember(wsId);
        allow create, delete: if false;
        // mark-as-read: append exactly your own uid to readBy
        allow update: if isMember(wsId)
          && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['readBy'])
          && request.resource.data.readBy == resource.data.readBy.concat([request.auth.uid]);
      }
    }
  }
}
```

## 5. Draft `storage.rules`

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    function isMember(wsId) {
      return request.auth != null
        && firestore.exists(/databases/(default)/documents/workspaces/$(wsId)/members/$(request.auth.uid));
    }

    // product uploads: members write images ≤ 15 MB
    match /ws/{wsId}/uploads/{productId}/{fileName} {
      allow read: if isMember(wsId);
      allow write: if isMember(wsId)
        && request.resource.size < 15 * 1024 * 1024
        && request.resource.contentType.matches('image/(png|jpeg|webp)');
      allow delete: if isMember(wsId);
    }

    // generated assets: read-only to clients; only the pipeline (Admin SDK) writes
    match /ws/{wsId}/assets/{assetId}/{fileName} {
      allow read: if isMember(wsId);
      allow write, delete: if false;
    }

    // workspace/brand logos: small images only
    match /ws/{wsId}/branding/{fileName} {
      allow read: if isMember(wsId);
      allow write: if isMember(wsId)
        && request.resource.size < 2 * 1024 * 1024
        && request.resource.contentType.matches('image/(png|jpeg|webp|svg\\+xml)');
    }

    match /{allPaths=**} { allow read, write: if false; }
  }
}
```

*Note:* Storage rules can reference Firestore (`firestore.exists`) — this keeps membership single-sourced.
