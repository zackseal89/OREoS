import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database";

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

export const supabase = createClient<Database>(url, publishableKey);
