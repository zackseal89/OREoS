import { Layers, Plus } from "lucide-react";
import { CampaignStatusBadge } from "../ui/Badge";
import { PlatformIcon } from "../ui/PlatformIcon";
import type { CampaignSummary } from "../../types";

function CampaignCard({ campaign }: { campaign: CampaignSummary }) {
  return (
    <article className="surface surface-hover group overflow-hidden">
      <div className="aspect-[16/10] overflow-hidden bg-neutral-100">
        <img
          src={campaign.coverUrl}
          alt={`${campaign.name} campaign cover`}
          loading="lazy"
          className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
        />
      </div>
      <div className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
          <h3 className="text-sm font-semibold">{campaign.name}</h3>
          <CampaignStatusBadge status={campaign.status} />
        </div>
        <div className="mt-2.5 flex items-center gap-1.5">
          {campaign.platforms.map((platform) => (
            <PlatformIcon key={platform} platform={platform} variant="glyph" className="size-3.5" />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-line pt-3 text-xs whitespace-nowrap text-ink-muted">
          <span className="flex items-center gap-1">
            <Layers className="size-3.5" aria-hidden />
            {campaign.assetCount} Assets
          </span>
          <span>{campaign.scheduleLabel}</span>
        </div>
      </div>
    </article>
  );
}

function CreateCampaignCard() {
  return (
    <button
      type="button"
      className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-[20px] border-2 border-dashed border-line bg-transparent p-4 text-center transition-colors hover:border-accent hover:bg-accent-soft/40 focus-visible:outline-2 focus-visible:outline-accent"
    >
      <span className="flex size-11 items-center justify-center rounded-full bg-accent text-white">
        <Plus className="size-5" aria-hidden />
      </span>
      <span className="text-sm font-semibold">Create New Campaign</span>
      <span className="text-xs text-ink-muted">Start from scratch or use a template</span>
    </button>
  );
}

export function RecentCampaigns({ campaigns }: { campaigns: CampaignSummary[] }) {
  return (
    <section aria-labelledby="recent-campaigns-title">
      <header className="mb-4 flex items-center justify-between">
        <h2 id="recent-campaigns-title" className="text-[17px] font-semibold">
          Recent Campaigns
        </h2>
        <button
          type="button"
          className="rounded-xl border border-line bg-card px-3.5 py-2 text-[13px] font-medium transition-transform hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-accent"
        >
          View All Campaigns
        </button>
      </header>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {campaigns.map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} />
        ))}
        <CreateCampaignCard />
      </div>
    </section>
  );
}
