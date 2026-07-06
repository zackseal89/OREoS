import type { GoogleGenAI } from "@google/genai";
import type { z } from "zod";
import { MODELS } from "./gemini.ts";

export type Part =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } }
  | { fileData: { fileUri: string; mimeType: string } };

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
              text: `Your previous response failed validation: ${lastError}. Respond with ONLY valid JSON matching the required shape.`,
            },
          ];

    const model = ai.getGenerativeModel({
      model: MODELS.text,
      tools: tools,
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: attemptParts }],
      generationConfig: { responseMimeType: "application/json" },
    });

    const response = await result.response;
    const text = response.text();

    try {
      return schema.parse(JSON.parse(text ?? ""));
    } catch (err) {
      lastError = String(err);
      console.error(`Attempt ${attempt + 1} failed validation: ${lastError}`);
    }
  }
  throw new Error(`Gemini response failed validation twice: ${lastError}`);
}
