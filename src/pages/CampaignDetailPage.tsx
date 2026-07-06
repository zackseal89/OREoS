import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  FolderOpen,
  Megaphone,
  MoreHorizontal,
  Package,
  Sparkles,
  Tag,
  TrendingUp,
  User,
} from "lucide-react";
import { cn } from "../lib/cn";
import { campaigns } from "../data/campaigns";
import { assets as allAssets } from "../data/assets";
import { FALLBACK_COVER } from "../data/campaigns";
import { TopNav } from "../components/layout/TopNav";
import { CampaignStatusBadge } from "../components/ui/Badge";
import { AssetCard } from "../components/assets/AssetCard";
import { AssetPreviewModal } from "../components/assets/AssetPreviewModal";
import { PlatformIcon } from "../components/ui/PlatformIcon";
import { useToast } from "../hooks/useToast";
import { notifications } from "../data/mock";
import type { Asset } from "../types";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "assets", label: "Assets" },
  { id: "copy", label: "Copy & Schedule" },
  { id: "analytics", label: "Analytics" },
] as const;

type TabId = (typeof TABS)[number]["id"];

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
  platform,
  copy,
}: {
  index: number;
  platform: string;
  copy: string;
}) {
  const { showToast } = useToast();
  return (
    <div className="surface p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-[13px] font-semibold text-ink-secondary">
          Post {index + 1} · {platform}
        </p>
        <button
          type="button"
          onClick={() => showToast("Copy editing arrives with the AI content flow milestone.")}
          className="rounded-lg px-2.5 py-1 text-xs font-medium text-ink-muted transition-colors hover:bg-canvas hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
        >
          Edit
        </button>
      </div>
      <p className="text-sm leading-relaxed text-ink-secondary">{copy}</p>
    </div>
  );
}

const MOCK_COPY = [
  {
    platform: "Instagram",
    copy: "☕ There's a cup of coffee for every kind of morning. Whether you're rushing out the door or savouring a slow sunrise — our Kenyan AA Beans bring the best of East Africa to your cup. Tap to shop. #KafeikoCoffee #KenyanCoffee #CoffeeCulture",
  },
  {
    platform: "TikTok",
    copy: "Wait until you see how these beans transform your morning ☕ Watch our roaster break down what makes Kenyan AA so special — bright, complex, and incredibly smooth. Link in bio. #CoffeeTikTok #KenyaAA #SpecialtyCoffee",
  },
  {
    platform: "Facebook",
    copy: "Introducing our Kenyan AA Beans — sourced from the highlands of Central Kenya and roasted right here in Nairobi. Notes of grapefruit and blackcurrant make every cup a little extraordinary. Order yours today. ↗",
  },
  {
    platform: "LinkedIn",
    copy: "At Kafe iko Coffee, we believe great coffee starts with great relationships. Our Kenyan AA sourcing programme works directly with smallholder farmers in Nyeri County, ensuring fair prices and exceptional quality. Read the story behind your cup. 🌱",
  },
];

function AnalyticsPlaceholder() {
  return (
    <div className="surface flex flex-col items-center gap-4 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-accent-soft text-accent-deep">
        <TrendingUp className="size-6" aria-hidden />
      </span>
      <h3 className="text-lg font-semibold">Analytics connect at launch</h3>
      <p className="max-w-sm text-sm text-ink-muted">
        Real-time reach, engagement, and conversion data will appear here once your social accounts
        are linked and posts start publishing.
      </p>
      <a
        href="/settings?tab=accounts"
        className="rounded-xl border border-line bg-card px-4 py-2.5 text-sm font-semibold transition-transform hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-accent"
      >
        Connect accounts →
      </a>
    </div>
  );
}

export function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast, showToast } = useToast();
  const [tab, setTab] = useState<TabId>("overview");
  const [previewId, setPreviewId] = useState<string | null>(null);

  const campaign = useMemo(() => campaigns.find((c) => c.id === id), [id]);

  const campaignAssets = useMemo(
    () => allAssets.filter((a) => a.campaignId === id),
    [id],
  );

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

  const handleDownload = (asset: Asset) =>
    showToast(`Downloading "${asset.name}" — exports arrive with Firebase Storage.`);

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
                onError={(e) => (e.currentTarget.src = FALLBACK_COVER)}
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
                      onClick={() => showToast("AI copy generation arrives in a later milestone.")}
                      className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-accent-deep"
                    >
                      <Sparkles className="size-4" aria-hidden />
                      Generate Assets
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
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                <StatCard label="Total Assets" value={campaign.assets} />
                <StatCard label="Scheduled" value={campaign.scheduled} />
                <StatCard label="Published" value={campaign.published} />
                <StatCard label="Reach" value={`${campaign.reachK}K`} sub="estimated" />
                <StatCard label="Engagement" value={`${campaign.engagementPct}%`} sub="avg. rate" />
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
                      onDelete={() => showToast("Deleting assets from the Campaign Workspace arrives in a later milestone.")}
                    />
                  ))}
                </div>
              </div>

              {/* AI Insights placeholder for campaign */}
              <div className="surface p-6">
                <h2 className="mb-4 flex items-center gap-2 text-[17px] font-semibold">
                  <Sparkles className="size-4.5 text-accent" aria-hidden />
                  AI Recommendations
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {[
                    {
                      tone: "bg-accent-soft text-accent-deep",
                      title: "Best time to post",
                      body: "Your audience on Instagram is most active between 6–9 PM EAT. Schedule your next post in this window for maximum reach.",
                    },
                    {
                      tone: "bg-info-soft text-info",
                      title: "Content mix suggestion",
                      body: "Add 2 more Reels to this campaign — video posts are getting 2.4× more reach than your static images right now.",
                    },
                    {
                      tone: "bg-warn-soft text-warn",
                      title: "Hashtag opportunity",
                      body: "#KenyaAACoffee has 85% less competition than #SpecialtyCoffee but similar reach potential for your audience size.",
                    },
                  ].map((rec) => (
                    <div key={rec.title} className="flex items-start gap-3 rounded-2xl border border-line p-4">
                      <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", rec.tone)}>
                        <Sparkles className="size-3.5" aria-hidden />
                      </span>
                      <div>
                        <p className="text-sm font-semibold">{rec.title}</p>
                        <p className="mt-1 text-[13px] leading-snug text-ink-muted">{rec.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab: Assets */}
          {tab === "assets" && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {campaignAssets.length === 0 ? (
                <div className="surface col-span-full flex flex-col items-center justify-center py-16 text-center">
                  <FolderOpen className="size-10 text-ink-muted" aria-hidden />
                  <p className="mt-3 text-sm text-ink-muted">No assets yet. Generate some with AI.</p>
                  <button
                    type="button"
                    onClick={() => showToast("AI generation arrives in a later milestone.")}
                    className="mt-4 flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    <Sparkles className="size-4" aria-hidden />
                    Generate Assets
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
                    onDelete={() => showToast("Asset deletes from Campaign Workspace arrive in a later milestone.")}
                  />
                ))
              )}
            </div>
          )}

          {/* Tab: Copy & Schedule */}
          {tab === "copy" && (
            <div className="space-y-4 max-w-2xl">
              <p className="text-sm text-ink-muted">
                AI-generated copy for each platform. Review and edit before publishing.
              </p>
              {MOCK_COPY.map((row, i) => (
                <CopyRow key={i} index={i} platform={row.platform} copy={row.copy} />
              ))}
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
            onAddToCampaign={() => showToast("Cross-campaign linking arrives with the Firestore milestone.")}
            onDelete={() => showToast("Asset deletes from Campaign Workspace arrive in a later milestone.")}
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
