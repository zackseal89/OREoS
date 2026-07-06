// extract-dossier — Sprint B2. Turns a product (uploaded image or URL) into a
// brand dossier via gemini-3.5-flash, then persists it as service role.
import { corsHeaders } from "../_shared/cors.ts";
import { json, toBase64 } from "../_shared/http.ts";
import { serviceClient, userClient } from "../_shared/clients.ts";
import { gemini } from "../_shared/gemini.ts";
import { generateJson, type Part } from "../_shared/generate.ts";
import { dossierSchema } from "../_shared/schemas.ts";

interface Payload {
  productId?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "missing Authorization header" }, 401);

  let productId: string | undefined;
  try {
    ({ productId } = (await req.json()) as Payload);
  } catch {
    return json({ error: "invalid JSON body" }, 400);
  }
  if (!productId) return json({ error: "productId is required" }, 400);

  try {
    // Existence + membership check under the caller's own RLS.
    const asUser = userClient(authHeader);
    const { data: product, error } = await asUser
      .from("products")
      .select("*")
      .eq("id", productId)
      .single();
    if (error || !product) return json({ error: "product not found or not permitted" }, 403);

    // Assemble the multimodal request.
    const svc = serviceClient();
    const parts: Part[] = [];
    const tools: any[] = [];

    if (product.source_type === "upload" && product.upload_path) {
      const { data: file } = await svc.storage.from("uploads").download(product.upload_path);
      if (file) {
        parts.push({
          inlineData: {
            mimeType: file.type || "image/jpeg",
            data: toBase64(new Uint8Array(await file.arrayBuffer())),
          },
        });
      }
    }

    if (product.source_type === "url" && product.source_url) {
      tools.push({ url_context: {} });
      parts.push({ text: `Analyze the product at this URL: ${product.source_url}` });
    }

    parts.push({ text: buildPrompt(product.name) });

    const dossier = await generateJson(gemini(), parts, dossierSchema, tools);

    // Pipeline-owned write: service role bypasses the products_guard lock on
    // status/dossier.
    const { error: writeError } = await svc
      .from("products")
      .update({ dossier, status: "ready" })
      .eq("id", productId);
    if (writeError) throw writeError;

    return json({ ok: true, dossier });
  } catch (err) {
    console.error("extract-dossier failed", err);
    // Flag for human review rather than leaving the product stuck in processing.
    await serviceClient()
      .from("products")
      .update({ status: "needs-review" })
      .eq("id", productId);
    return json({ error: String(err) }, 500);
  }
});

function buildPrompt(name: string): string {
  return [
    "You are an experienced marketing strategist. Analyze this product and extract its deep brand identity.",
    `Product name: ${name}.`,
    "Your goal is to define a brand that feels premium, consistent, and strategically positioned.",
    "Return JSON with the following fields:",
    "- colors: up to 8 hex values (#RRGGBB) that represent the brand's primary and secondary palette.",
    "- typographyHeadline: a font name or style for headlines.",
    "- typographyBody: a font name or style for body text.",
    "- aestheticTag: a 2-3 word description of the visual style (e.g., 'Minimalist Scandi-Chic', 'Bold Neon Brutalism').",
    "- valueProps: up to 8 short strings highlighting why a customer would care.",
    "- voiceSummary: a detailed summary (up to 600 chars) of the brand's tone of voice.",
    "- brandArchetype: the primary brand archetype (e.g., The Explorer, The Sage, The Magician).",
    "- targetAudiencePrimary: a concise description of the main customer segment.",
    "- marketPositioning: how this brand sits relative to competitors (e.g., 'Accessible luxury for Gen Z').",
  ].join("\n");
}
