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
    // TODO(B2): for source_type === "url", attach the `url_context` tool so
    // Gemini reads the page directly (ARCHITECTURE §4.1) instead of scraping.
    parts.push({ text: buildPrompt(product.name, product.source_url) });

    const dossier = await generateJson(gemini(), parts, dossierSchema);

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

function buildPrompt(name: string, url: string | null): string {
  return [
    "You are a brand strategist. Analyze this product and extract its brand identity.",
    `Product: ${name}.`,
    url ? `Reference URL: ${url}.` : "",
    "Return JSON with: colors (up to 8 hex values like #RRGGBB), typographyHeadline,",
    "typographyBody, aestheticTag, valueProps (up to 8 short strings), and",
    "voiceSummary (at most 600 characters).",
  ]
    .filter(Boolean)
    .join(" ");
}
