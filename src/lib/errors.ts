/**
 * Extract a human-readable message from anything thrown — Error, Supabase
 * PostgrestError/StorageError/FunctionsError (plain objects with `.message`),
 * strings, or arbitrary objects. Prevents the dreaded "[object Object]".
 */
export function errorMessage(e: unknown): string {
  if (e == null) return "Unknown error";
  if (typeof e === "string") return e;
  if (e instanceof Error) return e.message;
  if (typeof e === "object") {
    const o = e as Record<string, unknown>;
    const candidate =
      o.message ?? o.error_description ?? o.error ?? o.msg ?? o.details ?? o.hint;
    if (typeof candidate === "string" && candidate) return candidate;
    try {
      return JSON.stringify(e);
    } catch {
      return String(e);
    }
  }
  return String(e);
}

/**
 * Supabase Edge Functions return their JSON body on a non-2xx via
 * `FunctionsHttpError.context` (a Response). Pull the `error` field out of it so
 * we can show the function's own message (e.g. "GEMINI_API_KEY is not set").
 */
export async function functionErrorMessage(e: unknown): Promise<string> {
  const ctx = (e as { context?: unknown } | null)?.context;
  if (ctx && typeof (ctx as Response).json === "function") {
    try {
      const body = await (ctx as Response).clone().json();
      if (body && typeof body.error === "string") return body.error;
    } catch {
      /* fall through */
    }
  }
  return errorMessage(e);
}
