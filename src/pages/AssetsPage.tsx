import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, CircleHelp, Download, FolderPlus, Search, Trash2, Upload } from "lucide-react";
import { cn } from "../lib/cn";
import { supabase } from "../lib/supabase";
import { queryKeys } from "../lib/queryKeys";
import { useSession } from "../context/SessionContext";
import { useToast } from "../hooks/useToast";
import { useAssets, useCampaigns } from "../hooks/useData";
import { AssetCard, AssetSkeletonCard } from "../components/assets/AssetCard";
import { AssetPreviewModal } from "../components/assets/AssetPreviewModal";
import { AssetStats } from "../components/assets/AssetStats";
import { BulkActionBar } from "../components/ui/BulkActionBar";
import type { Asset, AssetStatus, Platform } from "../types";

const TABS = [
  { id: "all", label: "All Assets" },
  { id: "image", label: "Images" },
  { id: "video", label: "Videos" },
  { id: "carousel", label: "Carousels" },
  { id: "story", label: "Stories" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const STATUS_OPTIONS: Array<{ value: AssetStatus; label: string }> = [
  { value: "draft", label: "Draft" },
  { value: "pending-review", label: "Pending Review" },
  { value: "approved", label: "Approved" },
  { value: "scheduled", label: "Scheduled" },
  { value: "published", label: "Published" },
];

const PLATFORM_OPTIONS: Array<{ value: Platform; label: string }> = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "linkedin", label: "LinkedIn" },
];

type SortKey = "newest" | "oldest" | "name" | "campaign";

const SORTERS: Record<SortKey, (a: Asset, b: Asset) => number> = {
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id),
  oldest: (a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
  name: (a, b) => a.name.localeCompare(b.name),
  campaign: (a, b) => a.campaignName.localeCompare(b.campaignName) || a.name.localeCompare(b.name),
};

const PER_PAGE_OPTIONS = [24, 48, 96];

const selectClasses =
  "rounded-xl border border-line bg-card px-3 py-2.5 text-sm focus:border-accent focus:outline-2 focus:outline-accent/30";

function matchesQuery(asset: Asset, query: string): boolean {
  const tokens = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  const haystack = [
    asset.name,
    asset.campaignName,
    asset.product,
    asset.status,
    asset.type,
    asset.platform,
    ...asset.tags,
  ]
    .join(" ")
    .toLowerCase();
  return tokens.every((token) => haystack.includes(token));
}

function isTabId(value: string | null): value is TabId {
  return TABS.some((tab) => tab.id === value);
}

export function AssetsPage() {
  const { activeWorkspace } = useSession();
  const queryClient = useQueryClient();
  const { data: liveAssets, isLoading: loading } = useAssets();
  const { data: campaigns = [] } = useCampaigns();
  const [items, setItems] = useState<Asset[]>([]);
  useEffect(() => {
    if (liveAssets) setItems(liveAssets);
  }, [liveAssets]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set());
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(24);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const { toast, showToast } = useToast();

  // Campaign, status and type live in the URL so other pages can deep-link
  // (e.g. a campaign card's "View Assets" → /assets?campaign=<id>).
  const [params, setParams] = useSearchParams();
  const tabParam = params.get("type");
  const tab: TabId = isTabId(tabParam) ? tabParam : "all";
  const campaignFilter = params.get("campaign") ?? "all";
  const statusFilter = params.get("status") ?? "all";
  const platformFilter = params.get("platform") ?? "all";

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value === "all") next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  // Query + select filters (type tab excluded) — stats and tab counts derive from this.
  const filtered = useMemo(
    () =>
      items.filter(
        (asset) =>
          matchesQuery(asset, query) &&
          (campaignFilter === "all" || asset.campaignId === campaignFilter) &&
          (statusFilter === "all" || asset.status === statusFilter) &&
          (platformFilter === "all" || asset.platform === platformFilter),
      ),
    [items, query, campaignFilter, statusFilter, platformFilter],
  );

  const tabCounts = useMemo(() => {
    const counts = {} as Record<TabId, number>;
    for (const { id } of TABS) {
      counts[id] = id === "all" ? filtered.length : filtered.filter((a) => a.type === id).length;
    }
    return counts;
  }, [filtered]);

  const sorted = useMemo(
    () => [...(tab === "all" ? filtered : filtered.filter((a) => a.type === tab))].sort(SORTERS[sort]),
    [filtered, tab, sort],
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const pageItems = sorted.slice((page - 1) * perPage, page * perPage);

  useEffect(() => {
    setPage(1);
  }, [query, tab, campaignFilter, statusFilter, platformFilter, perPage, sort]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const previewIndex = previewId === null ? -1 : sorted.findIndex((a) => a.id === previewId);
  const previewAsset = previewIndex >= 0 ? sorted[previewIndex] : undefined;

  const navigatePreview = (direction: 1 | -1) => {
    if (sorted.length === 0 || previewIndex < 0) return;
    const nextIndex = (previewIndex + direction + sorted.length) % sorted.length;
    setPreviewId(sorted[nextIndex]?.id ?? null);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const deleteIds = (ids: string[]) => {
    setItems((current) => current.filter((a) => !ids.includes(a.id)));
    setSelectedIds((current) => {
      const next = new Set(current);
      for (const id of ids) next.delete(id);
      return next;
    });
    if (previewId !== null && ids.includes(previewId)) setPreviewId(null);
    void (async () => {
      await supabase.from("assets").delete().in("id", ids);
      if (activeWorkspace) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.assets(activeWorkspace.id) });
      }
    })();
  };

  const handleDownload = (asset: Asset) =>
    showToast(`Downloading “${asset.name}” — file exports arrive with Firebase Storage.`);

  const isFilteredView =
    query.trim() !== "" ||
    tab !== "all" ||
    campaignFilter !== "all" ||
    statusFilter !== "all" ||
    platformFilter !== "all";

  const selectedList = [...selectedIds];

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
            <h1 className="text-[34px] font-bold tracking-tight">Assets Library</h1>
            <p className="mt-1 text-[15px] text-ink-muted">
              Every image, video and carousel OREoS has generated across your campaigns.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="relative block">
              <span className="sr-only">Search assets</span>
              <Search
                className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-muted"
                aria-hidden
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search assets..."
                className="w-64 rounded-xl border border-line bg-card py-2.5 pr-4 pl-10 text-sm placeholder:text-ink-muted focus:border-accent focus:outline-2 focus:outline-accent/30"
              />
            </label>
            <button
              type="button"
              onClick={() => showToast("Direct uploads arrive with the Firebase Storage milestone.")}
              className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-accent-deep"
            >
              <Upload className="size-4" aria-hidden />
              Upload Assets
            </button>
          </div>
        </div>

        {/* Stats — react to search + filters */}
        <AssetStats assets={filtered} />

        {/* Tabs + filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line">
          <div role="tablist" aria-label="Asset type" className="flex gap-6 overflow-x-auto">
            {TABS.map(({ id, label }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setParam("type", id)}
                  className={cn(
                    "relative pb-3 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-accent",
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

          <div className="flex flex-wrap items-center gap-2 pb-2.5">
            <select
              value={campaignFilter}
              onChange={(event) => setParam("campaign", event.target.value)}
              aria-label="Filter by campaign"
              className={selectClasses}
            >
              <option value="all">All campaigns</option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(event) => setParam("status", event.target.value)}
              aria-label="Filter by status"
              className={selectClasses}
            >
              <option value="all">All statuses</option>
              {STATUS_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <select
              value={platformFilter}
              onChange={(event) => setParam("platform", event.target.value)}
              aria-label="Filter by platform"
              className={selectClasses}
            >
              <option value="all">All platforms</option>
              {PLATFORM_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
              aria-label="Sort assets"
              className={selectClasses}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="name">Name A–Z</option>
              <option value="campaign">By campaign</option>
            </select>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {loading ? (
            Array.from({ length: 12 }, (_, index) => <AssetSkeletonCard key={index} />)
          ) : pageItems.length === 0 ? (
            <div className="surface col-span-full flex flex-col items-center justify-center px-6 py-16 text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-accent-soft text-accent-deep">
                <FolderPlus className="size-6" aria-hidden />
              </span>
              <h3 className="mt-4 text-lg font-semibold">
                {isFilteredView ? "No assets match" : "No assets yet."}
              </h3>
              <p className="mt-1 max-w-sm text-sm text-ink-muted">
                {isFilteredView
                  ? "Try a different search or clear some filters."
                  : "Generate a campaign and its assets will land here."}
              </p>
            </div>
          ) : (
            pageItems.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                query={query}
                selected={selectedIds.has(asset.id)}
                onToggleSelect={toggleSelect}
                onPreview={(a) => setPreviewId(a.id)}
                onDownload={handleDownload}
                onDelete={(id) => {
                  deleteIds([id]);
                  showToast("Asset deleted.");
                }}
              />
            ))
          )}
        </div>

        {/* Pagination */}
        {!loading && sorted.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-ink-muted">
              Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, sorted.length)} of{" "}
              {sorted.length} assets
            </p>
            <nav aria-label="Pagination" className="flex items-center gap-1.5">
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => (
                <button
                  key={number}
                  type="button"
                  aria-current={page === number ? "page" : undefined}
                  onClick={() => setPage(number)}
                  className={cn(
                    "flex size-9 items-center justify-center rounded-xl border text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-accent",
                    page === number
                      ? "border-accent bg-accent text-white"
                      : "border-line bg-card text-ink-secondary hover:bg-neutral-100",
                  )}
                >
                  {number}
                </button>
              ))}
            </nav>
            <label className="flex items-center gap-2 text-sm text-ink-muted">
              Show
              <select
                value={perPage}
                onChange={(event) => setPerPage(Number(event.target.value))}
                className={selectClasses}
              >
                {PER_PAGE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              per page
            </label>
          </div>
        )}
      </div>

      {/* Preview modal */}
      {previewAsset && (
        <AssetPreviewModal
          asset={previewAsset}
          position={{ index: previewIndex, total: sorted.length }}
          onNavigate={navigatePreview}
          onDownload={handleDownload}
          onAddToCampaign={() => showToast("Cross-campaign linking arrives with the Firestore milestone.")}
          onDelete={(id) => {
            deleteIds([id]);
            showToast("Asset deleted.");
          }}
          onClose={() => setPreviewId(null)}
        />
      )}

      {/* Bulk selection */}
      <BulkActionBar
        count={selectedIds.size}
        noun="asset"
        onClear={() => setSelectedIds(new Set())}
        actions={[
          {
            label: "Download",
            icon: Download,
            onSelect: () =>
              showToast(`Preparing ${selectedList.length} file(s) — exports arrive with Firebase Storage.`),
          },
          {
            label: "Add to campaign",
            icon: FolderPlus,
            onSelect: () => showToast("Cross-campaign linking arrives with the Firestore milestone."),
          },
          {
            label: "Delete",
            icon: Trash2,
            danger: true,
            onSelect: () => {
              deleteIds(selectedList);
              showToast(`Deleted ${selectedList.length} asset(s).`);
            },
          },
        ]}
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
