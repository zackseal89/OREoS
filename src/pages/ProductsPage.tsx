import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CircleHelp, Plus, Search } from "lucide-react";
import { cn } from "../lib/cn";
import { products as seedProducts } from "../data/products";
import { BulkToolbar } from "../components/products/BulkToolbar";
import { ProductCard } from "../components/products/ProductCard";
import { ProductStats } from "../components/products/ProductStats";
import { EmptyState } from "../components/products/EmptyState";
import { SkeletonCard } from "../components/campaigns/SkeletonCard";
import type { Product } from "../types";

const TABS = [
  { id: "all", label: "All Products" },
  { id: "ready", label: "Ready" },
  { id: "processing", label: "Processing" },
  { id: "needs-review", label: "Needs Review" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const TAB_MATCHES: Record<TabId, (product: Product) => boolean> = {
  all: () => true,
  ready: (p) => p.status === "ready",
  processing: (p) => p.status === "processing",
  "needs-review": (p) => p.status === "needs-review",
};

function matchesQuery(product: Product, query: string): boolean {
  const tokens = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  const haystack = [product.name, product.brand, product.category, product.status]
    .join(" ")
    .toLowerCase();
  return tokens.every((token) => haystack.includes(token));
}

export function ProductsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Product[]>(seedProducts);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<TabId>("all");
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = (message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };
  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  // Simulated fetch so the skeleton state is real and visible.
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const filtered = useMemo(
    () => items.filter((p) => matchesQuery(p, query)),
    [items, query],
  );

  const tabCounts = useMemo(() => {
    const counts = {} as Record<TabId, number>;
    for (const { id } of TABS) counts[id] = filtered.filter(TAB_MATCHES[id]).length;
    return counts;
  }, [filtered]);

  const sorted = useMemo(
    () => filtered.filter(TAB_MATCHES[tab]).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [filtered, tab],
  );

  const isFilteredView = query.trim() !== "" || tab !== "all";

  const nameOf = (id: string) => items.find((p) => p.id === id)?.name ?? "product";

  const toggleSelect = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const archiveIds = (ids: string[]) => {
    setItems((current) => current.filter((p) => !ids.includes(p.id)));
  };

  const deleteIds = (ids: string[]) => {
    setItems((current) => current.filter((p) => !ids.includes(p.id)));
  };

  const clearSelection = () => setSelectedIds(new Set());
  const selectedList = [...selectedIds];

  const handleAddProduct = () => navigate("/");
  const handleCreateCampaign = (product: Product) =>
    showToast(`Creating a campaign from "${product.name}" arrives in a later milestone.`);

  return (
    <main className="relative flex-1">
      {/* Utility strip */}
      <div className="flex items-center justify-end gap-1.5 px-8 pt-4">
        <button
          type="button"
          aria-label="Notifications (3 unread)"
          className="relative rounded-xl p-2.5 transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-accent"
        >
          <Bell className="size-5 text-ink-secondary" aria-hidden />
          <span className="absolute top-0.5 right-0.5 flex size-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
            3
          </span>
        </button>
        <button
          type="button"
          aria-label="Help"
          className="rounded-xl p-2.5 transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-accent"
        >
          <CircleHelp className="size-5 text-ink-secondary" aria-hidden />
        </button>
      </div>

      <div className="mx-auto max-w-[1440px] space-y-6 px-8 pt-2 pb-10">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[34px] font-bold tracking-tight">Products</h1>
            <p className="mt-1 text-[15px] text-ink-muted">
              Every product OREoS has extracted a brand dossier for.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="relative block">
              <span className="sr-only">Search products</span>
              <Search
                className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-muted"
                aria-hidden
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search products..."
                className="w-64 rounded-xl border border-line bg-card py-2.5 pr-4 pl-10 text-sm placeholder:text-ink-muted focus:border-accent focus:outline-2 focus:outline-accent/30"
              />
            </label>

            <button
              type="button"
              onClick={handleAddProduct}
              className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-accent-deep"
            >
              <Plus className="size-4" aria-hidden />
              Add Product
            </button>
          </div>
        </div>

        {/* Statistics */}
        <ProductStats products={filtered} />

        {/* Tabs */}
        <div role="tablist" aria-label="Product status" className="flex gap-6 border-b border-line">
          {TABS.map(({ id, label }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(id)}
                className={cn(
                  "relative pb-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-accent",
                  active ? "text-accent-deep" : "text-ink-muted hover:text-ink",
                )}
              >
                {label} ({tabCounts[id]})
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

        {/* Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {loading ? (
            Array.from({ length: 8 }, (_, index) => <SkeletonCard key={index} />)
          ) : sorted.length === 0 ? (
            <EmptyState filtered={isFilteredView} onCreate={handleAddProduct} />
          ) : (
            sorted.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                query={query}
                selected={selectedIds.has(product.id)}
                onToggleSelect={toggleSelect}
                onOpen={(p) =>
                  showToast(`"${p.name}" opens the Product Detail view — coming in a later milestone.`)
                }
                onCreateCampaign={handleCreateCampaign}
                onArchive={(id) => {
                  const name = nameOf(id);
                  archiveIds([id]);
                  showToast(`Archived "${name}".`);
                }}
                onDelete={(id) => {
                  const name = nameOf(id);
                  deleteIds([id]);
                  setSelectedIds((current) => {
                    const next = new Set(current);
                    next.delete(id);
                    return next;
                  });
                  showToast(`Deleted "${name}".`);
                }}
              />
            ))
          )}
        </div>
      </div>

      {/* Bulk selection toolbar */}
      <BulkToolbar
        count={selectedIds.size}
        onCreateCampaign={() => showToast("Bulk campaign creation arrives in a later milestone.")}
        onArchive={() => {
          archiveIds(selectedList);
          clearSelection();
          showToast(`Archived ${selectedList.length} product(s).`);
        }}
        onDelete={() => {
          deleteIds(selectedList);
          clearSelection();
          showToast(`Deleted ${selectedList.length} product(s).`);
        }}
        onClear={clearSelection}
      />

      {/* Toast */}
      {toast && (
        <output className="surface fixed right-6 bottom-6 z-50 block px-4 py-3 text-sm font-medium shadow-lift">
          {toast}
        </output>
      )}
    </main>
  );
}
