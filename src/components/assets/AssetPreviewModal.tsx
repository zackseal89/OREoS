import { useEffect } from "react";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Download,
  FolderPlus,
  Trash2,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDuration } from "../../data/assets";
import { AssetStatusBadge } from "../ui/Badge";
import { PlatformIcon } from "../ui/PlatformIcon";
import type { Asset } from "../../types";

const PLATFORM_LABELS: Record<Asset["platform"], string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
};

interface AssetPreviewModalProps {
  asset: Asset;
  position: { index: number; total: number };
  onNavigate: (direction: 1 | -1) => void;
  onDownload: (asset: Asset) => void;
  onAddToCampaign: (asset: Asset) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function AssetPreviewModal({
  asset,
  position,
  onNavigate,
  onDownload,
  onAddToCampaign,
  onDelete,
  onClose,
}: AssetPreviewModalProps) {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") onNavigate(1);
      if (event.key === "ArrowLeft") onNavigate(-1);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose, onNavigate]);

  const metaRows: Array<[string, string]> = [
    ["Campaign", asset.campaignName],
    ["Product", asset.product],
    ["Platform", PLATFORM_LABELS[asset.platform]],
    ["Dimensions", asset.sizeLabel],
    ...(asset.durationSec !== undefined
      ? ([["Duration", formatDuration(asset.durationSec)]] as Array<[string, string]>)
      : []),
    ["Created", asset.createdAt],
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Preview of ${asset.name}`}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
    >
      {/* Scrim */}
      <div aria-hidden onClick={onClose} className="absolute inset-0 bg-ink/50" />

      {/* Prev / next */}
      <button
        type="button"
        aria-label="Previous asset"
        onClick={() => onNavigate(-1)}
        className="absolute left-4 z-10 hidden size-11 items-center justify-center rounded-full bg-card text-ink-secondary shadow-lift transition-transform hover:scale-105 sm:flex focus-visible:outline-2 focus-visible:outline-accent"
      >
        <ChevronLeft className="size-5" aria-hidden />
      </button>
      <button
        type="button"
        aria-label="Next asset"
        onClick={() => onNavigate(1)}
        className="absolute right-4 z-10 hidden size-11 items-center justify-center rounded-full bg-card text-ink-secondary shadow-lift transition-transform hover:scale-105 sm:flex focus-visible:outline-2 focus-visible:outline-accent"
      >
        <ChevronRight className="size-5" aria-hidden />
      </button>

      {/* Panel */}
      <div className="surface relative z-10 grid max-h-full w-full max-w-4xl overflow-hidden md:grid-cols-[1.3fr_1fr]">
        <div className="relative min-h-72 bg-neutral-100">
          <img src={asset.thumbnailUrl} alt={asset.name} className="absolute size-full object-cover" />
          <span className="absolute bottom-3 left-3 rounded-full bg-ink/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
            {position.index + 1} of {position.total}
          </span>
        </div>

        <div className="flex flex-col overflow-y-auto p-6">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-base leading-snug font-semibold">{asset.name}</h2>
            <button
              type="button"
              aria-label="Close preview"
              onClick={onClose}
              className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-neutral-100 hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
            >
              <X className="size-4.5" aria-hidden />
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <AssetStatusBadge status={asset.status} />
            <PlatformIcon platform={asset.platform} />
          </div>

          <dl className="mt-5 space-y-2.5 border-t border-line pt-5 text-sm">
            {metaRows.map(([term, detail]) => (
              <div key={term} className="flex justify-between gap-4">
                <dt className="text-ink-muted">{term}</dt>
                <dd className="text-right font-medium">{detail}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-1.5 flex flex-wrap gap-1.5 pt-3">
            {asset.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-ink-secondary"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-auto space-y-2 pt-6">
            <button
              type="button"
              onClick={() => onDownload(asset)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-accent-deep"
            >
              <Download className="size-4" aria-hidden />
              Download
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onAddToCampaign(asset)}
                className="flex items-center justify-center gap-2 rounded-xl border border-line bg-card px-3 py-2.5 text-[13px] font-medium transition-transform hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-accent"
              >
                <FolderPlus className="size-4" aria-hidden />
                Add to campaign
              </button>
              <button
                type="button"
                onClick={() => navigate("/campaigns")}
                className="flex items-center justify-center gap-2 rounded-xl border border-line bg-card px-3 py-2.5 text-[13px] font-medium transition-transform hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-accent"
              >
                <ArrowUpRight className="size-4" aria-hidden />
                View campaign
              </button>
            </div>
            <button
              type="button"
              onClick={() => onDelete(asset.id)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-danger/40 px-3 py-2.5 text-[13px] font-semibold text-danger transition-colors hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-danger"
            >
              <Trash2 className="size-4" aria-hidden />
              Delete asset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
