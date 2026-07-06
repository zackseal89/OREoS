import type { GoogleGenAI } from "@google/genai";
import type { z } from "zod";
import { MODELS } from "./gemini.ts";

export type Part = { text: string } | { inlineData: { mimeType: string; data: string } };

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
): Promise<T> {
  let lastError = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const attemptParts: Part[] =
      attempt === 0
        ? parts
        : [
            ...parts,
            {
              text: `Your previous response failed validation: ${lastError}. Respond with ONLY valid JSON matching the required shape.`,
            },
          ];

    const res = await ai.models.generateContent({
      model: MODELS.text,
      contents: [{ role: "user", parts: attemptParts }],
      // TODO(B2): attach `responseSchema` for schema-guaranteed output once the
      // exact @google/genai schema object is pinned against a live call.
      config: { responseMimeType: "application/json" },
    });

    try {
      return schema.parse(JSON.parse(res.text ?? ""));
    } catch (err) {
      lastError = String(err);
    }
  }
  throw new Error(`Gemini response failed validation twice: ${lastError}`);
}
