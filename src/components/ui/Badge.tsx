import { cn } from "../../lib/cn";
import type { AssetStatus, CampaignStatus, PostStatus, ProductStatus } from "../../types";

type BadgeTone = "success" | "warning" | "info" | "neutral" | "violet";

const TONE_CLASSES: Record<BadgeTone, string> = {
  success: "bg-accent-soft text-accent-deep",
  warning: "bg-warn-soft text-warn",
  info: "bg-info-soft text-info",
  neutral: "bg-neutral-100 text-ink-secondary",
  violet: "bg-violet-50 text-violet-600",
};

export function Badge({ tone, label }: { tone: BadgeTone; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        TONE_CLASSES[tone],
      )}
    >
      {label}
    </span>
  );
}

const POST_STATUS: Record<PostStatus, { tone: BadgeTone; label: string }> = {
  scheduled: { tone: "success", label: "Scheduled" },
  "pending-review": { tone: "warning", label: "Pending Review" },
  published: { tone: "info", label: "Published" },
};

export function PostStatusBadge({ status }: { status: PostStatus }) {
  const { tone, label } = POST_STATUS[status];
  return <Badge tone={tone} label={label} />;
}

const CAMPAIGN_STATUS: Record<CampaignStatus, { tone: BadgeTone; label: string }> = {
  active: { tone: "success", label: "Active" },
  draft: { tone: "neutral", label: "Draft" },
  completed: { tone: "info", label: "Completed" },
  paused: { tone: "warning", label: "Paused" },
  archived: { tone: "neutral", label: "Archived" },
};

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  const { tone, label } = CAMPAIGN_STATUS[status];
  return <Badge tone={tone} label={label} />;
}

const PRODUCT_STATUS: Record<ProductStatus, { tone: BadgeTone; label: string }> = {
  ready: { tone: "success", label: "Ready" },
  processing: { tone: "info", label: "Processing" },
  "needs-review": { tone: "warning", label: "Needs Review" },
};

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  const { tone, label } = PRODUCT_STATUS[status];
  return <Badge tone={tone} label={label} />;
}

// Matches PostStatusBadge colors where the statuses overlap (scheduled/published/pending).
const ASSET_STATUS: Record<AssetStatus, { tone: BadgeTone; label: string }> = {
  draft: { tone: "neutral", label: "Draft" },
  "pending-review": { tone: "warning", label: "Pending Review" },
  approved: { tone: "violet", label: "Approved" },
  scheduled: { tone: "success", label: "Scheduled" },
  published: { tone: "info", label: "Published" },
};

export function AssetStatusBadge({ status }: { status: AssetStatus }) {
  const { tone, label } = ASSET_STATUS[status];
  return <Badge tone={tone} label={label} />;
}
