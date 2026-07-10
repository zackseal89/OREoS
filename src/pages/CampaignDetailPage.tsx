import { useCallback, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  FolderOpen,
  Lightbulb,
  Loader2,
  Megaphone,
  MoreHorizontal,
  Package,
  Sparkles,
  Tag,
  TrendingUp,
  User,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "../lib/cn";
import { coverFor } from "../lib/cover";
import { supabase } from "../lib/supabase";
import { queryKeys } from "../lib/queryKeys";
import { downloadFile, safeFilename } from "../lib/download";
import { errorMessage, functionErrorMessage } from "../lib/errors";
import {
  useCampaign,
  useAssets,
  useCampaignIdeas,
  useGenerationJobs,
  useNotifications,
} from "../hooks/useData";
import { useRealtimeInvalidate } from "../hooks/useRealtimeInvalidate";
import { useSession } from "../context/SessionContext";
import { TopNav } from "../components/layout/TopNav";
import { CampaignStatusBadge } from "../components/ui/Badge";
import { AssetCard } from "../components/assets/AssetCard";
import { AssetPreviewModal } from "../components/assets/AssetPreviewModal";
import { IdeaCard } from "../components/campaigns/IdeaCard";
import { PlatformIcon } from "../components/ui/PlatformIcon";
import { useToast } from "../hooks/useToast";
import type { Asset } from "../types";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "ideas", label: "Ideas" },
  { id: "assets", label: "Assets" },
  { id: "copy", label: "Copy & Schedule" },
  { id: "analytics", label: "Analytics" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/** Tables whose broadcast events refresh this page (stable identity). */
const REALTIME_TABLES = ["assets", "generation_jobs", "notifications"] as const;

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="surface flex flex-col gap-1 p-5">
      <p className="text-[13px] text-ink-muted">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-ink-muted">{sub}</p>}
    </div>
  );
}

function CopyRow({
  index,
  asset,
  onCopied,
}: {
  index: number;
  asset: Asset;
  onCopied: () => void;
}) {
  const caption = asset.copyCaption ?? asset.name;
  const hashtags = (asset.copyHashtags ?? []).join(" ");
  const full = hashtags ? `${caption}\n\n${hashtags}` : caption;
  return (
    <div className="surface p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-[13px] font-semibold text-ink-secondary">
          Post {index + 1} · {asset.platform}
        </p>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(full);
            onCopied();
          }}
          className="rounded-lg px-2.5 py-1 text-xs font-medium text-ink-muted transition-colors hover:bg-canvas hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
        >
          Copy to clipboard
        </button>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-secondary">{caption}</p>
      {hashtags && <p className="mt-2 text-[13px] font-medium text-accent-deep">{hashtags}</p>}
    </div>
  );
}

function AnalyticsPlaceholder() {
  return (
    <div className="surface flex flex-col items-center gap-4 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-accent-soft text-accent-deep">
        <TrendingUp className="size-6" aria-hidden />
      </span>
      <h3 className="text-lg font-semibold">Analytics connect at launch</h3>
      <p className="max-w-sm text-sm text-ink-muted">
        Reach, engagement, and conversion data will appear here once your posts start publishing.
      </p>
    </div>
  );
}

export function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast, showToast } = useToast();
  const [tab, setTab] = useState<TabId>("overview");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [selectedIdeas, setSelectedIdeas] = useState<string[]>([]);
  const [generatingIdeas, setGeneratingIdeas] = useState(false);
  const [approving, setApproving] = useState(false);
  const queryClient = useQueryClient();
  const { activeWorkspace } = useSession();

  const { data: campaign, isLoading } = useCampaign(id);
  const { data: notifications = [] } = useNotifications();
  const { data: allAssets = [] } = useAssets();
  const { data: ideas = [] } = useCampaignIdeas(id);
  const { data: jobs = [] } = useGenerationJobs(id);

  // Refresh assets/jobs when the pipeline broadcasts workspace changes.
  const onRealtimeChange = useCallback(() => {
    if (!activeWorkspace) return;
    void queryClient.invalidateQueries({ queryKey: queryKeys.assets(activeWorkspace.id) });
    void queryClient.invalidateQueries({ queryKey: ["generationJobsByCampaign", id] });
    void queryClient.invalidateQueries({ queryKey: queryKeys.notifications(activeWorkspace.id) });
  }, [activeWorkspace, id, queryClient]);
  useRealtimeInvalidate(activeWorkspace?.id, REALTIME_TABLES, onRealtimeChange);

  const campaignAssets = useMemo(
    () => allAssets.filter((a) => a.campaignId === id),
    [allAssets, id],
  );

  const jobByIdea = useMemo(() => {
    const m = new Map<string, (typeof jobs)[number]>();
    for (const j of jobs) m.set(j.ideaId, j);
    return m;
  }, [jobs]);

  const proposedCount = ideas.filter((i) => i.status === "proposed").length;

  const invalidateIdeas = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.campaignIdeas(id ?? "none") });
    void queryClient.invalidateQueries({ queryKey: ["generationJobsByCampaign", id] });
  };

  const handleGenerateIdeas = async () => {
    if (!id || generatingIdeas) return;
    setGeneratingIdeas(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-ideas", {
        body: { campaignId: id },
      });
      if (error) throw new Error(await functionErrorMessage(error));
      invalidateIdeas();
      showToast(`OREoS pitched ${data?.count ?? "new"} ideas — review and approve the ones you like.`);
    } catch (err) {
      showToast(`Idea generation failed: ${errorMessage(err)}`);
    } finally {
      setGeneratingIdeas(false);
    }
  };

  const handleApproveGenerate = async (ideaIds: string[]) => {
    if (ideaIds.length === 0 || approving) return;
    setApproving(true);
    try {
      const { data, error } = await supabase.rpc("approve_and_generate", { idea_ids: ideaIds });
      if (error) throw error;
      const queued = (data as { queued?: number } | null)?.queued ?? ideaIds.length;
      setSelectedIdeas([]);
      invalidateIdeas();
      showToast(`${queued} generation job${queued === 1 ? "" : "s"} queued — assets land in review shortly.`);
    } catch (err) {
      showToast(`Couldn't start generation: ${errorMessage(err)}`);
    } finally {
      setApproving(false);
    }
  };

  const handleRejectIdea = async (ideaId: string) => {
    const { error } = await supabase
      .from("campaign_ideas")
      .update({ status: "rejected" })
      .eq("id", ideaId);
    if (error) {
      showToast(`Couldn't reject idea: ${error.message}`);
      return;
    }
    setSelectedIdeas((s) => s.filter((x) => x !== ideaId));
    invalidateIdeas();
  };

  const handleDeleteAsset = async (assetId: string) => {
    const { error } = await supabase.from("assets").delete().eq("id", assetId);
    if (error) {
      showToast(`Couldn't delete asset: ${error.message}`);
      return;
    }
    setPreviewId((p) => (p === assetId ? null : p));
    if (activeWorkspace) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.assets(activeWorkspace.id) });
    }
    showToast("Asset deleted.");
  };

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

  if (!campaign) {
    return (
      <>
        <TopNav notificationCount={notifications.length} />
        <main className="flex flex-1 flex-col items-center justify-center px-8 py-16">
          <div className="surface max-w-sm w-full p-10 text-center">
            <Megaphone className="mx-auto size-10 text-ink-muted" aria-hidden />
            <h1 className="mt-4 text-xl font-semibold">Campaign not found</h1>
            <p className="mt-2 text-sm text-ink-muted">
              This campaign may have been deleted or the link is invalid.
            </p>
            <button
              type="button"
              onClick={() => navigate("/campaigns")}
              className="mt-6 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
            >
              ← Back to Campaigns
            </button>
          </div>
        </main>
      </>
    );
  }

  const progress =
    campaign.assets > 0 ? Math.round((campaign.published / campaign.assets) * 100) : 0;

  const previewIndex = previewId === null ? -1 : campaignAssets.findIndex((a) => a.id === previewId);
  const previewAsset = previewIndex >= 0 ? campaignAssets[previewIndex] : undefined;

  const navigatePreview = (dir: 1 | -1) => {
    if (!campaignAssets.length || previewIndex < 0) return;
    const next = (previewIndex + dir + campaignAssets.length) % campaignAssets.length;
    setPreviewId(campaignAssets[next]?.id ?? null);
  };

  // HITL: exports are gated on human approval (Approvals page moves assets on).
  const handleDownload = (asset: Asset) => {
    if (asset.status === "draft" || asset.status === "pending-review") {
      showToast("This asset needs approval first — review it on the Approvals page.");
      return;
    }
    void downloadFile(asset.thumbnailUrl, safeFilename(asset.name));
    showToast(`Downloading "${asset.name}"…`);
  };

  return (
    <>
      <TopNav notificationCount={notifications.length} />
      <main className="flex-1">
        <div className="mx-auto max-w-[1440px] px-8 pb-16 pt-6">

          {/* Back breadcrumb */}
          <button
            type="button"
            onClick={() => navigate("/campaigns")}
            className="mb-5 flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Campaigns
          </button>

          {/* Hero cover + header */}
          <div className="surface mb-6 overflow-hidden">
            <div className="relative aspect-[4/1] overflow-hidden bg-neutral-100">
              <img
                src={campaign.coverUrl}
                alt=""
                onError={(e) => (e.currentTarget.src = coverFor(campaign.id))}
                className="size-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <CampaignStatusBadge status={campaign.status} />
                    <h1 className="mt-2 text-2xl font-bold text-white tracking-tight sm:text-3xl">
                      {campaign.name}
                    </h1>
                    <p className="mt-1 max-w-xl text-sm text-white/80">{campaign.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={generatingIdeas}
                      onClick={() => {
                        setTab("ideas");
                        if (ideas.length === 0) void handleGenerateIdeas();
                      }}
                      className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-accent-deep disabled:opacity-60"
                    >
                      {generatingIdeas ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                      ) : (
                        <Sparkles className="size-4" aria-hidden />
                      )}
                      {ideas.length === 0 ? "Generate Ideas" : "View Ideas"}
                    </button>
                    <button
                      type="button"
                      aria-label="More campaign actions"
                      className="flex size-10 items-center justify-center rounded-xl bg-card/20 text-white backdrop-blur-sm transition-colors hover:bg-card/40 focus-visible:outline-2 focus-visible:outline-accent"
                    >
                      <MoreHorizontal className="size-5" aria-hidden />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick meta strip */}
            <div className="flex flex-wrap items-center gap-6 border-t border-line px-6 py-3.5 text-[13px] text-ink-muted">
              <span className="flex items-center gap-1.5">
                <User className="size-3.5 shrink-0" aria-hidden />
                {campaign.owner}
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-3.5 shrink-0" aria-hidden />
                {campaign.dateRangeLabel}
              </span>
              <span className="flex items-center gap-1.5">
                <Package className="size-3.5 shrink-0" aria-hidden />
                {campaign.product}
              </span>
              <div className="flex items-center gap-1.5">
                {campaign.platforms.map((p) => (
                  <PlatformIcon key={p} platform={p} variant="chip" />
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 ml-auto">
                {campaign.tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 rounded-full border border-line bg-canvas px-2.5 py-0.5 text-[11px]"
                  >
                    <Tag className="size-2.5" aria-hidden />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div role="tablist" aria-label="Campaign sections" className="flex gap-6 border-b border-line mb-6">
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
                  {tabId === "assets" && (
                    <span className="ml-1.5 rounded-full bg-neutral-100 px-1.5 py-0.5 text-[11px] font-semibold text-ink-muted">
                      {campaignAssets.length}
                    </span>
                  )}
                  {tabId === "ideas" && proposedCount > 0 && (
                    <span className="ml-1.5 rounded-full bg-accent-soft px-1.5 py-0.5 text-[11px] font-semibold text-accent-deep">
                      {proposedCount}
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

          {/* Tab: Overview */}
          {tab === "overview" && (
            <div className="space-y-6">
              {/* Stats row */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <StatCard label="Total Assets" value={campaign.assets} />
                <StatCard label="Scheduled" value={campaign.scheduled} />
                <StatCard label="Published" value={campaign.published} />
                <div className="surface flex flex-col gap-1 p-5">
                  <p className="text-[13px] text-ink-muted">Progress</p>
                  <p className="text-2xl font-bold">{progress}%</p>
                  <div className="mt-auto h-1.5 overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Recent assets preview */}
              <div className="surface p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-[17px] font-semibold">
                    <FolderOpen className="size-4.5 text-accent" aria-hidden />
                    Recent Assets
                  </h2>
                  <button
                    type="button"
                    onClick={() => setTab("assets")}
                    className="text-sm font-medium text-accent transition-colors hover:text-accent-deep focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    View all {campaignAssets.length} →
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
                  {campaignAssets.slice(0, 6).map((asset) => (
                    <AssetCard
                      key={asset.id}
                      asset={asset}
                      query=""
                      selected={false}
                      onToggleSelect={() => {}}
                      onPreview={(a) => setPreviewId(a.id)}
                      onDownload={handleDownload}
                      onDelete={(assetId) => void handleDeleteAsset(assetId)}
                    />
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* Tab: Ideas — the HITL gate: AI pitches, the human decides */}
          {tab === "ideas" && (
            <div className="space-y-4">
              {ideas.length === 0 ? (
                <div className="surface flex flex-col items-center gap-4 py-16 text-center">
                  {generatingIdeas ? (
                    <>
                      <Loader2 className="size-10 animate-spin text-accent" aria-hidden />
                      <h3 className="text-lg font-semibold">Designing your campaign…</h3>
                      <p className="max-w-sm text-sm text-ink-muted">
                        OREoS is studying the product dossier and drafting 5–7 content ideas with
                        strategic rationale. This usually takes under a minute.
                      </p>
                    </>
                  ) : (
                    <>
                      <Lightbulb className="size-10 text-ink-muted" aria-hidden />
                      <h3 className="text-lg font-semibold">No ideas pitched yet</h3>
                      <p className="max-w-sm text-sm text-ink-muted">
                        Let OREoS design a cohesive campaign: 5–7 content ideas grounded in your
                        product's brand dossier. You approve what gets made — nothing generates
                        without your sign-off.
                      </p>
                      <button
                        type="button"
                        onClick={() => void handleGenerateIdeas()}
                        className="mt-2 flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
                      >
                        <Sparkles className="size-4" aria-hidden />
                        Generate Ideas
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-ink-muted">
                      {proposedCount > 0
                        ? `${proposedCount} idea${proposedCount === 1 ? "" : "s"} awaiting your judgement — approve the ones worth making.`
                        : "All ideas decided. Approved ideas generate assets automatically."}
                    </p>
                    <div className="flex items-center gap-2">
                      {selectedIdeas.length > 0 && (
                        <button
                          type="button"
                          disabled={approving}
                          onClick={() => void handleApproveGenerate(selectedIdeas)}
                          className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] disabled:opacity-50"
                        >
                          {approving ? (
                            <Loader2 className="size-4 animate-spin" aria-hidden />
                          ) : (
                            <Sparkles className="size-4" aria-hidden />
                          )}
                          Approve & Generate ({selectedIdeas.length})
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={generatingIdeas}
                        onClick={() => void handleGenerateIdeas()}
                        className="flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-ink-secondary transition-colors hover:bg-neutral-50 disabled:opacity-50"
                      >
                        {generatingIdeas ? (
                          <Loader2 className="size-4 animate-spin" aria-hidden />
                        ) : (
                          <Lightbulb className="size-4" aria-hidden />
                        )}
                        Pitch More Ideas
                      </button>
                    </div>
                  </div>
                  <div className="grid gap-4 lg:grid-cols-2">
                    {ideas.map((idea) => (
                      <IdeaCard
                        key={idea.id}
                        idea={idea}
                        jobStatus={jobByIdea.get(idea.id)?.status}
                        selected={selectedIdeas.includes(idea.id)}
                        onToggleSelect={(ideaId) =>
                          setSelectedIdeas((s) =>
                            s.includes(ideaId) ? s.filter((x) => x !== ideaId) : [...s, ideaId],
                          )
                        }
                        onApprove={(ideaId) => void handleApproveGenerate([ideaId])}
                        onReject={(ideaId) => void handleRejectIdea(ideaId)}
                        busy={approving}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Tab: Assets */}
          {tab === "assets" && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {campaignAssets.length === 0 ? (
                <div className="surface col-span-full flex flex-col items-center justify-center py-16 text-center">
                  <FolderOpen className="size-10 text-ink-muted" aria-hidden />
                  <p className="mt-3 text-sm text-ink-muted">
                    No assets yet. Approve ideas and OREoS generates them.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setTab("ideas");
                      if (ideas.length === 0) void handleGenerateIdeas();
                    }}
                    className="mt-4 flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    <Sparkles className="size-4" aria-hidden />
                    {ideas.length === 0 ? "Generate Ideas" : "Review Ideas"}
                  </button>
                </div>
              ) : (
                campaignAssets.map((asset) => (
                  <AssetCard
                    key={asset.id}
                    asset={asset}
                    query=""
                    selected={false}
                    onToggleSelect={() => {}}
                    onPreview={(a) => setPreviewId(a.id)}
                    onDownload={handleDownload}
                    onDelete={(assetId) => void handleDeleteAsset(assetId)}
                  />
                ))
              )}
            </div>
          )}

          {/* Tab: Copy & Schedule */}
          {tab === "copy" && (
            <div className="space-y-4 max-w-2xl">
              {campaignAssets.length === 0 ? (
                <div className="surface flex flex-col items-center gap-4 py-16 text-center">
                  <Sparkles className="size-10 text-ink-muted" aria-hidden />
                  <p className="text-sm text-ink-muted">
                    Generated post copy will appear here once this campaign has assets.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-ink-muted">
                    AI-generated copy for each post. Copy it straight into your platform of choice.
                  </p>
                  {campaignAssets.map((asset, i) => (
                    <CopyRow
                      key={asset.id}
                      index={i}
                      asset={asset}
                      onCopied={() => showToast("Caption copied to clipboard.")}
                    />
                  ))}
                </>
              )}
            </div>
          )}

          {/* Tab: Analytics */}
          {tab === "analytics" && <AnalyticsPlaceholder />}
        </div>

        {/* Asset preview modal */}
        {previewAsset && (
          <AssetPreviewModal
            asset={previewAsset}
            position={{ index: previewIndex, total: campaignAssets.length }}
            onNavigate={navigatePreview}
            onDownload={handleDownload}
            onAddToCampaign={() => showToast("Cross-campaign linking arrives in a later milestone.")}
            onDelete={(assetId) => void handleDeleteAsset(assetId)}
            onClose={() => setPreviewId(null)}
          />
        )}

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
