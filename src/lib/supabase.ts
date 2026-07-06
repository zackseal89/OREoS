import { createClient } from "@supabase/supabase-js";

// The publishable ("anon") key is safe in the browser: every table is guarded by
// Row-Level Security. Server-only secrets (service role, GEMINI_API_KEY) never
// live here — they belong to Edge Functions / Supabase secrets.
const url = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !publishableKey) {
  // Fail loud in dev; the app cannot talk to the backend without these.
  throw new Error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. Copy .env.example to .env and fill them in.",
  );
}

// TODO(B0): add the generated `Database` generic once `supabase gen types
// typescript` has produced src/types/database.ts — `createClient<Database>(...)`.
export const supabase = createClient(url, publishableKey);
