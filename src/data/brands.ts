import { workspace } from "./mock";
import type { Brand } from "../types";

/** Brand Library seed — the one identity every seeded product and campaign belongs to. */
export const brands: Brand[] = [
  {
    id: "brand-kafe-iko",
    name: workspace.name,
    logoUrl: workspace.logoUrl,
    industry: "Coffee & Beverage",
    colors: ["#1F1412", "#D66B47", "#FAF6F0", "#4E3629"],
    typographyHeadline: "Pure Craftsmanship.",
    voiceSummary:
      "Warm, artisanal, and sensory-driven, celebrating local Kenyan coffee heritage with an authentic, expert tone.",
    createdAt: "2025-01-14",
    updatedAt: "2025-05-20",
  },
];
