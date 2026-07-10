-- ============================================================================
-- OREoS 0012_pgrst_reload — PostgREST returned 404 for approve_and_generate
-- after 0010: stale schema cache. Explicitly reload it. (No-op if already
-- fresh; safe to re-run.)
-- ============================================================================

notify pgrst, 'reload schema';
