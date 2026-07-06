import { GoogleGenAI } from "@google/genai";

// Verified current model ids — see docs/RESEARCH_BRIEF.md.
export const MODELS = {
  /** Text + multimodal reasoning: dossier extraction, ideation, copywriting. */
  text: "gemini-3.5-flash",
  /** Nano Banana 2 — image generation/editing (Interactions API). */
  image: "gemini-3.1-flash-image",
} as const;

export function gemini(): GoogleGenAI {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Run: supabase secrets set GEMINI_API_KEY=...",
    );
  }
  return new GoogleGenAI({ apiKey });
}
