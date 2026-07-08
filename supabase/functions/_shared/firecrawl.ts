// Firecrawl v2 — robust web scraping for product URLs. Returns LLM-ready
// markdown (and, when available, structured product data) that we feed to
// Gemini instead of relying on the model's own url_context fetch, which is
// brittle on JS-rendered / anti-bot e-commerce pages.
//
// Key lives in Edge Function secrets, NOT the Vite .env:
//   supabase secrets set FIRECRAWL_API_KEY=fc-...

const ENDPOINT = "https://api.firecrawl.dev/v2/scrape";

/** Structured product fields Firecrawl extracts with the "product" format. */
export interface FirecrawlProduct {
  title?: string;
  description?: string;
  price?: string;
  currency?: string;
  brand?: string;
  images?: string[];
  availability?: string;
  rating?: number;
  reviews?: number;
}

export interface ScrapeResult {
  markdown: string;
  title?: string;
  description?: string;
  product?: FirecrawlProduct;
  /** Real product gallery image URLs, extracted structurally (see IMAGE_SCHEMA). */
  images: string[];
}

// Firecrawl's LLM-backed `json` format extracts the gallery URLs reliably.
// Regex over markdown is not viable here: Jumia (and others) embed parens in
// image URLs (…/filters:fill(white)/…), which breaks naive `![](...)` parsing.
const IMAGE_FORMAT = {
  type: "json",
  prompt:
    "Extract the URLs of the main product gallery images — the actual product " +
    "photos only. Exclude banners, ads, promo GIFs, icons, logos, and payment badges.",
  schema: {
    type: "object",
    properties: { image_urls: { type: "array", items: { type: "string" } } },
    required: ["image_urls"],
  },
} as const;

const MAX_IMAGES = 8;

/**
 * Scrape a single URL to clean markdown (+ structured product data when the
 * page exposes it). Throws on missing key, network failure, or a non-2xx /
 * unsuccessful Firecrawl response — the caller translates that into the
 * product's `needs-review` state rather than persisting a partial dossier.
 */
export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (!apiKey) {
    throw new Error(
      "FIRECRAWL_API_KEY is not set. Run: supabase secrets set FIRECRAWL_API_KEY=...",
    );
  }

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      url,
      // markdown = brand voice / copy; product = structured facts when present;
      // json (IMAGE_FORMAT) = the real product gallery image URLs.
      formats: ["markdown", "product", IMAGE_FORMAT],
      onlyMainContent: true,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Firecrawl scrape failed (${res.status}): ${detail.slice(0, 500)}`);
  }

  const body = (await res.json()) as {
    success?: boolean;
    error?: string;
    data?: {
      markdown?: string;
      product?: FirecrawlProduct;
      json?: { image_urls?: unknown };
      metadata?: { title?: string; description?: string };
    };
  };

  if (body.success === false || !body.data) {
    throw new Error(`Firecrawl returned no data: ${body.error ?? "unknown error"}`);
  }

  const markdown = body.data.markdown?.trim() ?? "";
  if (!markdown) throw new Error("Firecrawl returned empty markdown for the URL");

  // Prefer the json-format extraction; fall back to the product format's images.
  // Dedupe — the extraction model sometimes lists the same gallery photo twice.
  const rawImages = body.data.json?.image_urls ?? body.data.product?.images ?? [];
  const images = [
    ...new Set(
      (Array.isArray(rawImages) ? rawImages : []).filter(
        (u): u is string => typeof u === "string" && /^https?:\/\//.test(u),
      ),
    ),
  ].slice(0, MAX_IMAGES);

  return {
    markdown,
    title: body.data.metadata?.title,
    description: body.data.metadata?.description,
    product: body.data.product,
    images,
  };
}
