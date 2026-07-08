-- ============================================================================
-- OREoS 0009_notification_prefs — per-user notification toggle storage.
-- Keys mirror the six toggles on Settings → Notifications. No new table:
-- these are low-cardinality user prefs, a jsonb column on profiles is enough.
-- ============================================================================

alter table profiles
  add column notification_prefs jsonb not null default jsonb_build_object(
    'published', true,
    'failed', true,
    'ai', true,
    'digest', false,
    'expiry', true,
    'product', false
  );
