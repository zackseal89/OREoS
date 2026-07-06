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
  brandArchetype: z.string().max(100),
  targetAudiencePrimary: z.string().max(200),
  marketPositioning: z.string().max(300),
});
export type Dossier = z.infer<typeof dossierSchema>;

export const platformSchema = z.enum(["instagram", "facebook", "tiktok", "linkedin"]);
export const formatSchema = z.enum(["image", "video", "carousel", "story"]);

export const campaignStrategySchema = z.object({
  objective: z.string().max(100),
  targetAudienceSegment: z.string().max(200),
  contentPillars: z.array(z.string().max(100)).max(5),
  creativeDirection: z.string().max(500),
  recommendedSchedule: z.string().max(300),
});
export type CampaignStrategy = z.infer<typeof campaignStrategySchema>;

export const ideaSchema = z.object({
  title: z.string().max(120),
  description: z.string().max(500),
  format: formatSchema,
  platforms: z.array(platformSchema).min(1).max(4),
  strategicRationale: z.string().max(500),
  creativeDirection: z.string().max(500),
  contentPillar: z.string().max(100),
});
export type Idea = z.infer<typeof ideaSchema>;

export const ideasSchema = z.object({
  strategy: campaignStrategySchema,
  ideas: z.array(ideaSchema).min(5).max(7),
});
export type Ideas = z.infer<typeof ideasSchema>;

export const assetGenerationSchema = z.object({
  caption: z.string().max(2200),
  hashtags: z.array(z.string()).max(30),
  cta: z.string().max(80),
  performanceScore: z.number().min(0).max(100),
  brandFitScore: z.number().min(0).max(100),
  strategicRationale: z.string().max(500),
});
export type AssetGeneration = z.infer<typeof assetGenerationSchema>;
