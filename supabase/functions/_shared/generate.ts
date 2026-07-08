import type { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { MODELS } from "./gemini.ts";

export type Part =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } }
  | { fileData: { fileUri: string; mimeType: string } };

/**
 * Gemini occasionally wraps JSON output in markdown fences or leading/trailing
 * prose even with responseMimeType set. Strip fences and slice to the outermost
 * {...} span before parsing, so a stray "```json" or "Here is the JSON:" prefix
 * doesn't cause a spurious syntax error.
 */
function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  return start >= 0 && end > start ? body.slice(start, end + 1) : body;
}

/**
 * Call Gemini for JSON output and validate against a Zod schema, with one
 * corrective retry that feeds the validation error back to the model. Throws if
 * both attempts fail — callers translate that into a `needs-review` state rather
 * than persisting a partial result.
 */
export async function generateJson<T>(
  ai: GoogleGenAI,
  parts: Part[],
  schema: z.ZodType<T>,
  tools?: any[],
): Promise<T> {
  let lastError = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const attemptParts: any[] =
      attempt === 0
        ? parts
        : [
            ...parts,
            {
              text:
                `Your previous response failed validation: ${lastError}. ` +
                "Respond with ONLY valid JSON matching the required shape — no markdown " +
                "fences, no commentary. Ensure every string value has internal quotes, " +
                "newlines, and other special characters properly JSON-escaped.",
            },
          ];

    const response = await ai.models.generateContent({
      model: MODELS.text,
      contents: [{ role: "user", parts: attemptParts }],
      config: {
        responseMimeType: "application/json",
        // Constrains generation to the real field names/types instead of
        // relying on the prose prompt alone — fixes the model inventing
        // different key names (e.g. "rationale" vs "strategicRationale").
        responseJsonSchema: z.toJSONSchema(schema),
        ...(tools ? { tools } : {}),
      },
    });

    const text = response.text ?? "";

    try {
      return schema.parse(JSON.parse(extractJson(text)));
    } catch (err) {
      lastError = String(err);
      console.error(`Attempt ${attempt + 1} failed validation: ${lastError}`);
      console.error(`Attempt ${attempt + 1} raw text (first 2000 chars):`, text.slice(0, 2000));
    }
  }
  throw new Error(`Gemini response failed validation twice: ${lastError}`);
}
