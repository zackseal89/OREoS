// generate-ideas — Sprint B3. Turns a campaign + its product dossier into a
// cohesive multi-platform campaign strategy and 5–7 proposed content ideas.
import { corsHeaders } from "../_shared/cors.ts";
import { json } from "../_shared/http.ts";
import { serviceClient, userClient } from "../_shared/clients.ts";
import { gemini } from "../_shared/gemini.ts";
import { generateJson } from "../_shared/generate.ts";
import { ideasSchema } from "../_shared/schemas.ts";

interface Payload {
  campaignId?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "missing Authorization header" }, 401);

  let campaignId: string | undefined;
  try {
    ({ campaignId } = (await req.json()) as Payload);
  } catch {
    return json({ error: "invalid JSON body" }, 400);
  }
  if (!campaignId) return json({ error: "campaignId is required" }, 400);

  try {
    const asUser = userClient(authHeader);
    const { data: campaign, error } = await asUser
      .from("campaigns")
      .select("*, products(*)")
      .eq("id", campaignId)
      .single();
    if (error || !campaign) return json({ error: "campaign not found or not permitted" }, 403);

    const { strategy, ideas } = await generateJson(
      gemini(),
      [{ text: buildPrompt(campaign) }],
      ideasSchema,
    );

    const svc = serviceClient();

    // 1. Update campaign with the strategic direction
    const { error: campaignError } = await svc
      .from("campaigns")
      .update({ strategy })
      .eq("id", campaignId);
    if (campaignError) throw campaignError;

    // 2. Insert the ideas with their specific strategic rationales and creative directions
    const rows = ideas.map((idea) => ({
      campaign_id: campaignId,
      workspace_id: campaign.workspace_id,
      title: idea.title,
      description: idea.description,
      format: idea.format,
      platforms: idea.platforms,
      strategic_rationale: idea.strategicRationale,
      creative_direction: idea.creativeDirection,
      content_pillar: idea.contentPillar,
      status: "proposed",
    }));

    const { error: insertError } = await svc.from("campaign_ideas").insert(rows);
    if (insertError) throw insertError;

    return json({ ok: true, count: rows.length, strategy });
  } catch (err) {
    console.error("generate-ideas failed", err);
    return json({ error: String(err) }, 500);
  }
});

function buildPrompt(campaign: Record<string, any>): string {
  const product = campaign.products as Record<string, any> | null;
  const dossier = product?.dossier;
  const platforms = Array.isArray(campaign.platforms) ? campaign.platforms.join(", ") : "any";

  return [
    "You are an experienced marketing strategist. Your task is to design a cohesive multi-platform campaign.",
    `Campaign name: ${campaign.name}.`,
    `Campaign description: ${campaign.description ?? "N/A"}.`,
    dossier ? `Brand dossier: ${JSON.stringify(dossier)}.` : "No brand dossier provided.",
    `Target platforms: ${platforms}.`,
    "",
    "Phase 1: Determine the Strategy",
    "- Define a specific campaign objective based on the product and brand.",
    "- Identify the specific target audience segment for this campaign.",
    "- Establish 3-5 content pillars that will guide the creative work.",
    "- Provide a high-level creative direction for the entire campaign.",
    "- Recommend an optimal posting schedule/frequency.",
    "",
    "Phase 2: Generate Content Ideas",
    "- Propose 5 to 7 distinct content ideas that work together as a cohesive campaign, not isolated posts.",
    "- For each idea, provide a strategic rationale explaining WHY it fits the campaign strategy and brand dossier.",
    "- Provide specific creative direction for the asset generation phase (visual style, key elements, mood).",
    "- Map each idea to one of the content pillars.",
    "",
    "Return JSON matching the required schema.",
    "Format is one of image|video|carousel|story.",
    "Platforms is a subset of instagram|facebook|tiktok|linkedin.",
  ].join("\n");
}
