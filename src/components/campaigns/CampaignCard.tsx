import { useRef, useState } from "react";
import {
  Archive,
  ArrowUpRight,
  CalendarDays,
  Copy,
  Ellipsis,
  FolderOpen,
  Pencil,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "../../lib/cn";
import { useClickOutside } from "../../hooks/useClickOutside";
import { FALLBACK_COVER } from "../../data/campaigns";
import { CampaignStatusBadge } from "../ui/Badge";
import { Highlight } from "../ui/Highlight";
import { PlatformIcon } from "../ui/PlatformIcon";
import type { Campaign } from "../../types";

const MAX_PLATFORM_CHIPS = 3;

interface CampaignCardProps {
  campaign: Campaign;
  query: string;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onOpen: (campaign: Campaign) => void;
  onDuplicate: (id: string) => void;
  onRename: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}

interface MenuAction {
  label: string;
  icon: LucideIcon;
  danger?: boolean;
  onSelect: () => void;
}

export function CampaignCard({
  campaign,
  query,
  selected,
  onToggleSelect,
  onOpen,
  onDuplicate,
  onRename,
  onArchive,
  onDelete,
}: CampaignCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  useClickOutside(menuRef, () => setMenuOpen(false), menuOpen);

  const progress = campaign.assets > 0 ? Math.round((campaign.published / campaign.assets) * 100) : 0;
  const extraPlatforms = campaign.platforms.length - MAX_PLATFORM_CHIPS;

  const menuActions: MenuAction[] = [
    { label: "Open", icon: ArrowUpRight, onSelect: () => onOpen(campaign) },
    {
      label: "View Assets",
      icon: FolderOpen,
      onSelect: () => navigate(`/assets?campaign=${campaign.id}`),
    },
    { label: "Duplicate", icon: Copy, onSelect: () => onDuplicate(campaign.id) },
    { label: "Rename", icon: Pencil, onSelect: () => onRename(campaign.id) },
    { label: "Archive", icon: Archive, onSelect: () => onArchive(campaign.id) },
    { label: "Delete", icon: Trash2, danger: true, onSelect: () => onDelete(campaign.id) },
  ];

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Open ${campaign.name}`}
      onClick={() => onOpen(campaign)}
      onKeyDown={(event) => {
        if (event.key === "Enter" && event.target === event.currentTarget) {
          onOpen(campaign);
        }
      }}
      className={cn(
        "surface surface-hover group flex cursor-pointer flex-col overflow-hidden text-left focus-visible:outline-2 focus-visible:outline-accent",
        selected && "ring-2 ring-accent",
      )}
    >
      {/* Cover */}
      <div className="relative aspect-video overflow-hidden bg-neutral-100">
        <img
          src={campaign.coverUrl}
          alt=""
          loading="lazy"
          onError={(event) => {
            event.currentTarget.src = FALLBACK_COVER;
          }}
          className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
        />

        {/* Hover action overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-ink/35 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <span className="pointer-events-none flex items-center gap-1.5 rounded-full bg-card px-4 py-2 text-sm font-semibold shadow-lift">
            Open Campaign
            <ArrowUpRight className="size-4" aria-hidden />
          </span>
        </div>

        {/* Select checkbox + status badge */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <input
            type="checkbox"
            checked={selected}
            aria-label={`Select ${campaign.name}`}
            onClick={(event) => event.stopPropagation()}
            onChange={() => onToggleSelect(campaign.id)}
            className={cn(
              "size-4.5 cursor-pointer rounded accent-accent transition-opacity",
              selected ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
            )}
          />
          <CampaignStatusBadge status={campaign.status} />
        </div>

        {/* Overflow menu */}
        <div ref={menuRef} className="absolute top-3 right-3">
          <button
            type="button"
            aria-label={`More actions for ${campaign.name}`}
            aria-expanded={menuOpen}
            onClick={(event) => {
              event.stopPropagation();
              setMenuOpen((open) => !open);
            }}
            className="flex size-8 items-center justify-center rounded-full bg-card/90 text-ink-secondary shadow-card backdrop-blur-sm transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
          >
            <Ellipsis className="size-4" aria-hidden />
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="surface absolute right-0 z-20 mt-1.5 w-40 p-1.5"
              onClick={(event) => event.stopPropagation()}
            >
              {menuActions.map(({ label, icon: Icon, danger, onSelect }) => (
                <button
                  key={label}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onSelect();
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-accent",
                    danger ? "text-danger hover:bg-red-50" : "text-ink-secondary hover:bg-canvas hover:text-ink",
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-semibold">
          <Highlight text={campaign.name} query={query} />
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm leading-snug text-ink-muted">
          <Highlight text={campaign.description} query={query} />
        </p>

        <div className="mt-3 flex items-center gap-1.5">
          {campaign.platforms.slice(0, MAX_PLATFORM_CHIPS).map((platform) => (
            <PlatformIcon key={platform} platform={platform} />
          ))}
          {extraPlatforms > 0 && (
            <span className="flex size-7 items-center justify-center rounded-full border border-line bg-card text-[11px] font-medium text-ink-muted">
              +{extraPlatforms}
            </span>
          )}
        </div>

        <p className="mt-3 flex items-center gap-1.5 border-b border-line pb-3 text-[13px] text-ink-muted">
          <CalendarDays className="size-3.5" aria-hidden />
          {campaign.dateRangeLabel}
        </p>

        {/* Stats */}
        <dl className="grid grid-cols-3 divide-x divide-line pt-3 text-center">
          {(
            [
              [campaign.assets, "Assets"],
              [campaign.scheduled, "Scheduled"],
              [campaign.published, "Published"],
            ] as const
          ).map(([value, label]) => (
            <div key={label}>
              <dt className="sr-only">{label}</dt>
              <dd className="text-base font-bold">{value}</dd>
              <dd className="text-xs text-ink-muted">{label}</dd>
            </div>
          ))}
        </dl>

        {/* Progress */}
        <div className="mt-auto pt-4">
          <div
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${campaign.name} progress`}
            className="h-1.5 overflow-hidden rounded-full bg-neutral-100"
          >
            <div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-ink-muted">{progress}% Completed</p>
        </div>
      </div>
    </article>
  );
}
