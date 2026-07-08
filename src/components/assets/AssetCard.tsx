import { Download, Eye, Image, Images, Smartphone, Trash2, Video, type LucideIcon } from "lucide-react";
import { cn } from "../../lib/cn";
import { formatDuration } from "../../lib/format";
import { AssetStatusBadge } from "../ui/Badge";
import { Highlight } from "../ui/Highlight";
import { PlatformIcon } from "../ui/PlatformIcon";
import type { Asset, AssetType } from "../../types";

export const ASSET_TYPE_ICONS: Record<AssetType, LucideIcon> = {
  image: Image,
  video: Video,
  carousel: Images,
  story: Smartphone,
};

interface AssetCardProps {
  asset: Asset;
  query: string;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onPreview: (asset: Asset) => void;
  onDownload: (asset: Asset) => void;
  onDelete: (id: string) => void;
}

export function AssetCard({
  asset,
  query,
  selected,
  onToggleSelect,
  onPreview,
  onDownload,
  onDelete,
}: AssetCardProps) {
  const TypeIcon = ASSET_TYPE_ICONS[asset.type];

  return (
    <article
      className={cn(
        "surface surface-hover group overflow-hidden",
        selected && "ring-2 ring-accent",
      )}
    >
      {/* Thumbnail */}
      <div className="relative aspect-square overflow-hidden bg-neutral-100">
        <img
          src={asset.thumbnailUrl}
          alt=""
          loading="lazy"
          className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
        />

        {/* Hover actions */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-ink/35 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          {(
            [
              { label: `Preview ${asset.name}`, icon: Eye, handler: () => onPreview(asset) },
              { label: `Download ${asset.name}`, icon: Download, handler: () => onDownload(asset) },
              { label: `Delete ${asset.name}`, icon: Trash2, handler: () => onDelete(asset.id) },
            ] as const
          ).map(({ label, icon: Icon, handler }) => (
            <button
              key={label}
              type="button"
              aria-label={label}
              onClick={handler}
              className="flex size-9 items-center justify-center rounded-full bg-card text-ink-secondary shadow-lift transition-transform hover:scale-105 hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
            >
              <Icon className="size-4" aria-hidden />
            </button>
          ))}
        </div>

        {/* Select checkbox */}
        <input
          type="checkbox"
          checked={selected}
          aria-label={`Select ${asset.name}`}
          onChange={() => onToggleSelect(asset.id)}
          className={cn(
            "absolute top-2.5 left-2.5 size-4.5 cursor-pointer rounded accent-accent transition-opacity",
            selected ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
          )}
        />

        {/* Status */}
        <span className="absolute top-2.5 right-2.5">
          <AssetStatusBadge status={asset.status} />
        </span>

        {/* Type + duration */}
        <span className="absolute bottom-2.5 left-2.5 flex items-center gap-1 rounded-full bg-ink/60 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
          <TypeIcon className="size-3" aria-hidden />
          {asset.type === "video" && asset.durationSec !== undefined
            ? formatDuration(asset.durationSec)
            : asset.type.charAt(0).toUpperCase() + asset.type.slice(1)}
        </span>
      </div>

      {/* Meta */}
      <div className="p-3.5">
        <button
          type="button"
          onClick={() => onPreview(asset)}
          title={asset.name}
          className="block w-full truncate text-left text-[13px] font-semibold hover:text-accent-deep focus-visible:outline-2 focus-visible:outline-accent"
        >
          <Highlight text={asset.name} query={query} />
        </button>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="truncate text-xs text-ink-muted">
            <Highlight text={asset.campaignName} query={query} />
          </span>
          <PlatformIcon platform={asset.platform} variant="glyph" className="size-3 shrink-0" />
        </div>
      </div>
    </article>
  );
}

export function AssetSkeletonCard() {
  return (
    <div className="surface animate-pulse overflow-hidden" aria-hidden>
      <div className="aspect-square bg-neutral-100" />
      <div className="space-y-2 p-3.5">
        <div className="h-3.5 w-4/5 rounded-full bg-neutral-100" />
        <div className="h-3 w-3/5 rounded-full bg-neutral-100" />
      </div>
    </div>
  );
}
