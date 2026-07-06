// generate-ideas — Sprint B3. Turns a campaign + its product dossier into 5–7
// proposed content ideas, inserted as service role (clients cannot create ideas).
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

    const { ideas } = await generateJson(gemini(), [{ text: buildPrompt(campaign) }], ideasSchema);

    const svc = serviceClient();
    const rows = ideas.map((idea) => ({
      campaign_id: campaignId,
      workspace_id: campaign.workspace_id,
      title: idea.title,
      description: idea.description,
      format: idea.format,
      platforms: idea.platforms,
      rationale: idea.rationale,
      status: "proposed",
    }));
    const { error: insertError } = await svc.from("campaign_ideas").insert(rows);
    if (insertError) throw insertError;

    return json({ ok: true, count: rows.length });
  } catch (err) {
    console.error("generate-ideas failed", err);
    return json({ error: String(err) }, 500);
  }
});

function buildPrompt(campaign: Record<string, unknown>): string {
  const product = campaign.products as Record<string, unknown> | null;
  const dossier = product?.dossier;
  const platforms = Array.isArray(campaign.platforms) ? campaign.platforms.join(", ") : "any";
  return [
    "You are a social media campaign strategist.",
    `Campaign: ${campaign.name}. ${campaign.description ?? ""}`,
    dossier ? `Brand dossier: ${JSON.stringify(dossier)}.` : "",
    `Target platforms: ${platforms}.`,
    "Propose 5 to 7 distinct content ideas. Return JSON of shape",
    '{ "ideas": [{ "title", "description", "format", "platforms", "rationale" }] }.',
    "format is one of image|video|carousel|story; platforms is a subset of",
    "instagram|facebook|tiktok|linkedin.",
  ]
    .filter(Boolean)
    .join(" ");
}
