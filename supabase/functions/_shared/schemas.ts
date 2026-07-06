import { z } from "zod";

// Response contracts. Every Gemini JSON response is validated against these
// BEFORE any DB write — an invalid response is retried once, then the row is
// flagged needs-review rather than persisted partially.

export const dossierSchema = z.object({
  colors: z.array(z.string().regex(/^#[0-9A-Fa-f]{6}$/)).max(8),
  typographyHeadline: z.string().max(120),
  typographyBody: z.string().max(300),
  aestheticTag: z.string().max(80),
  valueProps: z.array(z.string().max(200)).max(8),
  voiceSummary: z.string().max(600),
});
export type Dossier = z.infer<typeof dossierSchema>;

const platform = z.enum(["instagram", "facebook", "tiktok", "linkedin"]);
const format = z.enum(["image", "video", "carousel", "story"]);

export const ideasSchema = z.object({
  ideas: z
    .array(
      z.object({
        title: z.string().max(120),
        description: z.string().max(500),
        format,
        platforms: z.array(platform).min(1).max(4),
        rationale: z.string().max(300),
      }),
    )
    .min(5)
    .max(7),
});
export type Ideas = z.infer<typeof ideasSchema>;

export const copySchema = z.object({
  caption: z.string().max(2200),
  hashtags: z.array(z.string()).max(30),
  cta: z.string().max(80),
});
export type Copy = z.infer<typeof copySchema>;
