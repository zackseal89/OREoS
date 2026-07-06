import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are injected into
// every Edge Function's environment by the platform.

/** Service-role client: bypasses RLS. Use only for pipeline-owned writes. */
export function serviceClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}

/**
 * Client acting AS the calling user, so RLS applies. Used to verify the caller
 * actually has access before the service client does any privileged write.
 */
export function userClient(authHeader: string): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    },
  );
}
