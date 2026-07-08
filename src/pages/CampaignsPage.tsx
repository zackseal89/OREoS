import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Check,
  ChevronDown,
  CircleHelp,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "../lib/cn";
import { supabase } from "../lib/supabase";
import { queryKeys } from "../lib/queryKeys";
import { useSession } from "../context/SessionContext";
import { useCampaigns } from "../hooks/useData";
import { useClickOutside } from "../hooks/useClickOutside";
import { BulkToolbar } from "../components/campaigns/BulkToolbar";
import { CampaignCard } from "../components/campaigns/CampaignCard";
import { CampaignStats } from "../components/campaigns/CampaignStats";
import { EmptyState } from "../components/campaigns/EmptyState";
import { FilterDrawer } from "../components/campaigns/FilterDrawer";
import { SkeletonCard } from "../components/campaigns/SkeletonCard";
import { createCampaignModal } from "../App";
import type { Campaign, CampaignFilters, CampaignSortKey } from "../types";

const TABS = [
  { id: "all", label: "All Campaigns" },
  { id: "active", label: "Active" },
  { id: "completed", label: "Completed" },
  { id: "drafts", label: "Drafts" },
  { id: "archived", label: "Archived" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const TAB_MATCHES: Record<TabId, (campaign: Campaign) => boolean> = {
  all: (c) => c.status !== "archived",
  active: (c) => c.status === "active",
  completed: (c) => c.status === "completed",
  drafts: (c) => c.status === "draft",
  archived: (c) => c.status === "archived",
};

const SORT_OPTIONS: Array<{ key: CampaignSortKey; label: string; short: string }> = [
  { key: "recent", label: "Recently Updated", short: "Recent" },
  { key: "newest", label: "Newest", short: "Newest" },
  { key: "oldest", label: "Oldest", short: "Oldest" },
  { key: "assets", label: "Most Assets", short: "Assets" },
  { key: "alpha", label: "Alphabetical", short: "A–Z" },
];

const SORTERS: Record<CampaignSortKey, (a: Campaign, b: Campaign) => number> = {
  recent: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  oldest: (a, b) => a.createdAt.localeCompare(b.createdAt),
  reach: (a, b) => b.reachK - a.reachK,
  engagement: (a, b) => b.engagementPct - a.engagementPct,
  assets: (a, b) => b.assets - a.assets,
  alpha: (a, b) => a.name.localeCompare(b.name),
};

const EMPTY_FILTERS: CampaignFilters = {
  statuses: [],
  platforms: [],
  product: "all",
  owner: "all",
  hasScheduled: "any",
  from: "",
  to: "",
};

const PER_PAGE_OPTIONS = [8, 16, 24];

function matchesQuery(campaign: Campaign, query: string): boolean {
  const tokens = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  const haystack = [
    campaign.name,
    campaign.description,
    campaign.brand,
    campaign.product,
    campaign.status,
    ...campaign.tags,
    ...campaign.platforms,
  ]
    .join(" ")
    .toLowerCase();
  return tokens.every((token) => haystack.includes(token));
}

function matchesFilters(campaign: Campaign, filters: CampaignFilters): boolean {
  if (filters.statuses.length > 0 && !filters.statuses.includes(campaign.status)) return false;
  if (
    filters.platforms.length > 0 &&
    !filters.platforms.some((platform) => campaign.platforms.includes(platform))
  ) {
    return false;
  }
  if (filters.product !== "all" && campaign.product !== filters.product) return false;
  if (filters.owner !== "all" && campaign.owner !== filters.owner) return false;
  if (filters.hasScheduled === "yes" && campaign.scheduled === 0) return false;
  if (filters.hasScheduled === "no" && campaign.scheduled > 0) return false;
  if (filters.from && campaign.createdAt < filters.from) return false;
  if (filters.to && campaign.createdAt > filters.to) return false;
  return true;
}

function countActiveFilters(filters: CampaignFilters): number {
  return (
    filters.statuses.length +
    filters.platforms.length +
    (filters.product !== "all" ? 1 : 0) +
    (filters.owner !== "all" ? 1 : 0) +
    (filters.hasScheduled !== "any" ? 1 : 0) +
    (filters.from || filters.to ? 1 : 0)
  );
}

function CreateCampaignCard({ onCreate }: { onCreate: () => void }) {
  return (
    <button
      type="button"
      onClick={onCreate}
      className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-[20px] border-2 border-dashed border-line p-6 text-center transition-colors hover:border-accent hover:bg-accent-soft/40 focus-visible:outline-2 focus-visible:outline-accent"
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-accent text-white">
        <Plus className="size-6" aria-hidden />
      </span>
      <span className="text-base font-semibold">Create New Campaign</span>
      <span className="flex items-center gap-1.5 text-sm text-ink-muted">
        Start from scratch or
        <span className="flex items-center gap-1 font-medium text-accent">
          <Sparkles className="size-3.5" aria-hidden />
          Use AI
        </span>
      </span>
    </button>
  );
}

export function CampaignsPage() {
  const navigate = useNavigate();
  const { activeWorkspace, session } = useSession();
  const queryClient = useQueryClient();
  const { data: liveCampaigns, isLoading: loading } = useCampaigns();
  const [items, setItems] = useState<Campaign[]>([]);
  useEffect(() => {
    if (liveCampaigns) setItems(liveCampaigns);
  }, [liveCampaigns]);
  const invalidate = () => {
    if (activeWorkspace) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.campaigns(activeWorkspace.id) });
    }
  };

  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<TabId>("all");
  const [sort, setSort] = useState<CampaignSortKey>("recent");
  const [sortOpen, setSortOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filters, setFilters] = useState<CampaignFilters>(EMPTY_FILTERS);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set());
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(8);
  const [toast, setToast] = useState<string | null>(null);

  const sortRef = useRef<HTMLDivElement>(null);
  useClickOutside(sortRef, () => setSortOpen(false), sortOpen);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = (message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };
  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  // Search + drawer filters (tab-independent). Stats and tab counts derive from this.
  const filtered = useMemo(
    () => items.filter((c) => matchesQuery(c, query) && matchesFilters(c, filters)),
    [items, query, filters],
  );

  const tabCounts = useMemo(() => {
    const counts = {} as Record<TabId, number>;
    for (const { id } of TABS) counts[id] = filtered.filter(TAB_MATCHES[id]).length;
    return counts;
  }, [filtered]);

  const sorted = useMemo(
    () => [...filtered.filter(TAB_MATCHES[tab])].sort(SORTERS[sort]),
    [filtered, tab, sort],
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const pageItems = sorted.slice((page - 1) * perPage, page * perPage);

  useEffect(() => {
    setPage(1);
  }, [query, tab, filters, perPage, sort]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const products = useMemo(() => [...new Set(items.map((c) => c.product))].sort(), [items]);
  const owners = useMemo(() => [...new Set(items.map((c) => c.owner))].sort(), [items]);

  const activeFilterCount = countActiveFilters(filters);
  const isFilteredView = activeFilterCount > 0 || query.trim() !== "" || tab !== "all";

  const nameOf = (id: string) => items.find((c) => c.id === id)?.name ?? "campaign";

  const toggleSelect = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Persist a duplicate as a fresh draft campaign, then refresh from the server.
  const duplicateIds = (ids: string[]) => {
    if (!activeWorkspace || !session) return;
    void (async () => {
      const rows = items.filter((c) => ids.includes(c.id));
      for (const original of rows) {
        await supabase.from("campaigns").insert({
          workspace_id: activeWorkspace.id,
          owner_id: session.user.id,
          name: `${original.name} (Copy)`,
          description: original.description || null,
          platforms: original.platforms,
          tags: original.tags,
          status: "draft",
        });
      }
      invalidate();
    })();
  };

  const archiveIds = (ids: string[]) => {
    setItems((current) =>
      current.map((c) => (ids.includes(c.id) ? { ...c, status: "archived" as const } : c)),
    );
    void (async () => {
      await supabase.from("campaigns").update({ status: "archived" }).in("id", ids);
      invalidate();
    })();
  };

  const deleteIds = (ids: string[]) => {
    setItems((current) => current.filter((c) => !ids.includes(c.id)));
    void (async () => {
      await supabase.from("campaigns").delete().in("id", ids);
      invalidate();
    })();
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleCreate = () => createCampaignModal.open();


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
            <h1 className="text-[34px] font-bold tracking-tight">Campaigns</h1>
            <p className="mt-1 text-[15px] text-ink-muted">
              Create, manage and track all your AI-powered marketing campaigns.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="relative block">
              <span className="sr-only">Search campaigns</span>
              <Search
                className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-muted"
                aria-hidden
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search campaigns..."
                className="w-64 rounded-xl border border-line bg-card py-2.5 pr-12 pl-10 text-sm placeholder:text-ink-muted focus:border-accent focus:outline-2 focus:outline-accent/30"
              />
              <kbd className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded-md border border-line bg-canvas px-1.5 py-0.5 font-sans text-[11px] text-ink-muted">
                ⌘ K
              </kbd>
            </label>

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-line bg-card px-4 py-2.5 text-sm font-medium transition-transform hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-accent"
            >
              <SlidersHorizontal className="size-4" aria-hidden />
              Filter
              {activeFilterCount > 0 && (
                <span className="flex size-5 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <div ref={sortRef} className="relative">
              <button
                type="button"
                aria-expanded={sortOpen}
                onClick={() => setSortOpen((open) => !open)}
                className="flex items-center gap-2 rounded-xl border border-line bg-card px-4 py-2.5 text-sm font-medium transition-transform hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-accent"
              >
                Sort by: {SORT_OPTIONS.find((option) => option.key === sort)?.short}
                <ChevronDown className="size-4 text-ink-muted" aria-hidden />
              </button>
              {sortOpen && (
                <div role="menu" className="surface absolute right-0 z-20 mt-1.5 w-52 p-1.5">
                  {SORT_OPTIONS.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      role="menuitemradio"
                      aria-checked={sort === option.key}
                      onClick={() => {
                        setSort(option.key);
                        setSortOpen(false);
                      }}
                      className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-sm text-ink-secondary transition-colors hover:bg-canvas hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
                    >
                      {option.label}
                      {sort === option.key && <Check className="size-4 text-accent" aria-hidden />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleCreate}
              className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-accent-deep"
            >
              <Plus className="size-4" aria-hidden />
              New Campaign
            </button>
          </div>
        </div>

        {/* Statistics — react to search + drawer filters */}
        <CampaignStats campaigns={filtered} />

        {/* Tabs */}
        <div role="tablist" aria-label="Campaign status" className="flex gap-6 border-b border-line">
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
          ) : pageItems.length === 0 ? (
            <EmptyState filtered={isFilteredView} onCreate={handleCreate} />
          ) : (
            <>
              {pageItems.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  query={query}
                  selected={selectedIds.has(campaign.id)}
                  onToggleSelect={toggleSelect}
                  onOpen={(c) => navigate(`/campaigns/${c.id}`)}
                  onDuplicate={(id) => {
                    duplicateIds([id]);
                    showToast(`Duplicated “${nameOf(id)}” as a draft.`);
                  }}
                  onRename={() => showToast("Rename lands with the Campaign Workspace milestone.")}
                  onArchive={(id) => {
                    const name = nameOf(id);
                    archiveIds([id]);
                    showToast(`Archived “${name}”.`);
                  }}
                  onDelete={(id) => {
                    const name = nameOf(id);
                    deleteIds([id]);
                    setSelectedIds((current) => {
                      const next = new Set(current);
                      next.delete(id);
                      return next;
                    });
                    showToast(`Deleted “${name}”.`);
                  }}
                />
              ))}
              {page === totalPages && <CreateCampaignCard onCreate={handleCreate} />}
            </>
          )}
        </div>

        {/* Pagination */}
        {!loading && sorted.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-ink-muted">
              Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, sorted.length)} of{" "}
              {sorted.length} campaigns
            </p>

            <nav aria-label="Pagination" className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label="Previous page"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex size-9 items-center justify-center rounded-xl border border-line bg-card text-ink-secondary transition-colors not-disabled:hover:bg-neutral-100 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-accent"
              >
                <ArrowLeft className="size-4" aria-hidden />
              </button>
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
              <button
                type="button"
                aria-label="Next page"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="flex size-9 items-center justify-center rounded-xl border border-line bg-card text-ink-secondary transition-colors not-disabled:hover:bg-neutral-100 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-accent"
              >
                <ArrowRight className="size-4" aria-hidden />
              </button>
            </nav>

            <label className="flex items-center gap-2 text-sm text-ink-muted">
              Show
              <select
                value={perPage}
                onChange={(event) => setPerPage(Number(event.target.value))}
                className="rounded-xl border border-line bg-card px-2.5 py-2 text-sm text-ink focus:border-accent focus:outline-2 focus:outline-accent/30"
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

      {/* Filter drawer */}
      <FilterDrawer
        open={drawerOpen}
        filters={filters}
        products={products}
        owners={owners}
        onChange={setFilters}
        onClear={() => setFilters(EMPTY_FILTERS)}
        onClose={() => setDrawerOpen(false)}
      />

      {/* Bulk selection toolbar */}
      <BulkToolbar
        count={selectedIds.size}
        onDuplicate={() => {
          duplicateIds(selectedList);
          clearSelection();
          showToast(`Duplicated ${selectedList.length} campaign(s) as drafts.`);
        }}
        onArchive={() => {
          archiveIds(selectedList);
          clearSelection();
          showToast(`Archived ${selectedList.length} campaign(s).`);
        }}
        onDelete={() => {
          deleteIds(selectedList);
          clearSelection();
          showToast(`Deleted ${selectedList.length} campaign(s).`);
        }}
        onExport={() => showToast("Export is part of a later milestone.")}
        onSchedule={() => showToast("Bulk scheduling is part of a later milestone.")}
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
