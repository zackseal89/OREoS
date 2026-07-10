import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Link as LinkIcon,
  Megaphone,
  Package,
  Sparkles,
  Tag,
} from "lucide-react";
import { cn } from "../lib/cn";
import { createCampaignModal } from "../App";
import { useProduct, useCampaigns, useNotifications } from "../hooks/useData";
import { TopNav } from "../components/layout/TopNav";
import { ProductStatusBadge } from "../components/ui/Badge";
import { useToast } from "../hooks/useToast";

const TABS = [
  { id: "dossier", label: "Brand Dossier" },
  { id: "campaigns", label: "Linked Campaigns" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tab, setTab] = useState<TabId>("dossier");

  const { data: product, isLoading } = useProduct(id);
  const { data: notifications = [] } = useNotifications();
  const { data: campaigns = [] } = useCampaigns();

  const linkedCampaigns = useMemo(
    () => campaigns.filter((c) => c.product === product?.name),
    [campaigns, product],
  );

  const DOSSIER = product?.dossier;

  if (isLoading) {
    return (
      <>
        <TopNav notificationCount={notifications.length} />
        <main className="flex flex-1 items-center justify-center min-h-[300px]">
          <div className="size-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </main>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <TopNav notificationCount={notifications.length} />
        <main className="flex flex-1 flex-col items-center justify-center px-8 py-16">
          <div className="surface max-w-sm w-full p-10 text-center">
            <Package className="mx-auto size-10 text-ink-muted" aria-hidden />
            <h1 className="mt-4 text-xl font-semibold">Product not found</h1>
            <p className="mt-2 text-sm text-ink-muted">
              This product may have been deleted or the link is invalid.
            </p>
            <button
              type="button"
              onClick={() => navigate("/products")}
              className="mt-6 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
            >
              ← Back to Products
            </button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <TopNav notificationCount={notifications.length} />
      <main className="flex-1">
        <div className="mx-auto max-w-[1100px] px-8 pb-16 pt-6">

          {/* Breadcrumb */}
          <button
            type="button"
            onClick={() => navigate("/products")}
            className="mb-5 flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Products
          </button>

          {/* Header card */}
          <div className="surface mb-6 overflow-hidden">
            <div className="flex flex-wrap gap-6 p-6">
              <div className="size-28 shrink-0 overflow-hidden rounded-2xl bg-neutral-100">
                <img
                  src={product.coverUrl}
                  alt={product.name}
                  className="size-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <ProductStatusBadge status={product.status} />
                    <h1 className="mt-2 text-2xl font-bold tracking-tight">{product.name}</h1>
                    <p className="mt-1 text-sm text-ink-muted">
                      {product.brand} · {product.category}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => createCampaignModal.open(product.id)}
                    className="flex shrink-0 items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-accent-deep"
                  >
                    <Megaphone className="size-4" aria-hidden />
                    Create Campaign
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-5 text-[13px] text-ink-muted">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="size-3.5 shrink-0" aria-hidden />
                    Added {product.createdAt}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Tag className="size-3.5 shrink-0" aria-hidden />
                    {product.category}
                  </span>
                  {product.sourceUrl && (
                    <a
                      href={product.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-accent hover:text-accent-deep"
                    >
                      <LinkIcon className="size-3.5 shrink-0" aria-hidden />
                      Source URL
                    </a>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Megaphone className="size-3.5 shrink-0" aria-hidden />
                    {product.linkedCampaigns} linked campaign{product.linkedCampaigns === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div role="tablist" aria-label="Product sections" className="flex gap-6 border-b border-line mb-6">
            {TABS.map(({ id: tabId, label }) => {
              const active = tab === tabId;
              return (
                <button
                  key={tabId}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(tabId)}
                  className={cn(
                    "relative pb-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-accent",
                    active ? "text-accent-deep" : "text-ink-muted hover:text-ink",
                  )}
                >
                  {label}
                  {tabId === "campaigns" && (
                    <span className="ml-1.5 rounded-full bg-neutral-100 px-1.5 py-0.5 text-[11px] font-semibold text-ink-muted">
                      {linkedCampaigns.length}
                    </span>
                  )}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute right-0 bottom-0 left-0 h-0.5 origin-left rounded-full bg-accent transition-transform duration-300",
                      active ? "scale-x-100" : "scale-x-0",
                    )}
                  />
                </button>
              );
            })}
          </div>

          {/* Tab: Brand Dossier */}
          {tab === "dossier" && (
            product.status === "processing" ? (
              <div className="surface flex flex-col items-center gap-4 py-16 text-center">
                <span className="flex size-14 items-center justify-center rounded-full bg-info-soft text-info">
                  <Sparkles className="size-6 animate-pulse" aria-hidden />
                </span>
                <h3 className="text-lg font-semibold">OREoS is extracting the brand dossier…</h3>
                <p className="max-w-sm text-sm text-ink-muted">
                  This usually takes under a minute. The dossier will appear here once the AI
                  extraction is complete.
                </p>
              </div>
            ) : !DOSSIER ? (
              <div className="surface flex flex-col items-center gap-4 py-16 text-center">
                <span className="flex size-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                  <Sparkles className="size-6" aria-hidden />
                </span>
                <h3 className="text-lg font-semibold">No dossier available</h3>
                <p className="max-w-sm text-sm text-ink-muted">
                  Extraction needs another look. Re-run it from the product intake to generate the
                  brand dossier.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
                {/* Asset thumbnails */}
                <div className="surface p-6">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    Extracted Assets
                  </h2>
                  {DOSSIER.assetUrls.length === 0 ? (
                    <p className="mt-4 text-sm text-ink-muted">No product images were extracted.</p>
                  ) : (
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {DOSSIER.assetUrls.map((url, i) => (
                        <div
                          key={`${i}-${url}`}
                          className="aspect-square overflow-hidden rounded-xl bg-neutral-100"
                        >
                          <img src={url} alt="" className="size-full object-cover" loading="lazy" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Dossier details */}
                <div className="space-y-5">
                  <section className="surface p-6">
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      Visual Identity
                    </h2>
                    <div className="mt-4 flex gap-4">
                      {DOSSIER.colors.map((hex) => (
                        <div key={hex} className="flex flex-col items-center gap-1.5">
                          <span
                            className="size-12 rounded-full border border-line"
                            style={{ backgroundColor: hex }}
                          />
                          <span className="text-[11px] text-ink-muted">{hex}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="surface p-6">
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      Typography & Voice
                    </h2>
                    <p className="mt-3 text-xl font-bold">{DOSSIER.typographyHeadline}</p>
                    <p className="mt-1.5 text-sm text-ink-muted">{DOSSIER.typographyBody}</p>
                    <p className="mt-3 text-sm italic text-ink-secondary">
                      "{DOSSIER.voiceSummary}"
                    </p>
                    <span className="mt-3 inline-block rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-ink-secondary">
                      {DOSSIER.aestheticTag}
                    </span>
                  </section>

                  <section className="surface p-6">
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      Core Value Propositions
                    </h2>
                    <ol className="mt-3 space-y-2.5 text-sm">
                      {DOSSIER.valueProps.map((prop, i) => (
                        <li key={prop} className="flex gap-2.5">
                          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[11px] font-semibold text-accent-deep">
                            {i + 1}
                          </span>
                          {prop}
                        </li>
                      ))}
                    </ol>
                  </section>
                </div>
              </div>
            )
          )}

          {/* Tab: Linked Campaigns */}
          {tab === "campaigns" && (
            linkedCampaigns.length === 0 ? (
              <div className="surface flex flex-col items-center gap-4 py-16 text-center">
                <Megaphone className="size-10 text-ink-muted" aria-hidden />
                <p className="text-sm text-ink-muted">No campaigns linked to this product yet.</p>
                <button
                  type="button"
                  onClick={() => createCampaignModal.open(product.id)}
                  className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white"
                >
                  <Megaphone className="size-4" aria-hidden />
                  Create First Campaign
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {linkedCampaigns.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => navigate(`/campaigns/${c.id}`)}
                    className="surface surface-hover flex w-full items-center gap-4 p-4 text-left focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    <img
                      src={c.coverUrl}
                      alt=""
                      className="size-14 shrink-0 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{c.name}</p>
                      <p className="mt-0.5 truncate text-sm text-ink-muted">{c.description}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1 text-[13px] text-ink-muted">
                      <span>{c.assets} assets</span>
                      <span>{c.dateRangeLabel}</span>
                    </div>
                  </button>
                ))}
              </div>
            )
          )}
        </div>

        {/* Toast */}
        {toast && (
          <output className="surface fixed right-6 bottom-6 z-50 block px-4 py-3 text-sm font-medium shadow-lift">
            {toast}
          </output>
        )}
      </main>
    </>
  );
}
