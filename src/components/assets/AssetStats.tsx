import {
  CircleCheck,
  Clock,
  GalleryHorizontalEnd,
  Image,
  Layers,
  Video,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../../lib/cn";
import type { Asset, Tone } from "../../types";

const TONE_CHIP: Record<Tone, string> = {
  green: "bg-accent-soft text-accent-deep",
  blue: "bg-info-soft text-info",
  violet: "bg-violet-50 text-violet-600",
  amber: "bg-warn-soft text-warn",
  pink: "bg-pink-50 text-pink-600",
  teal: "bg-teal-50 text-teal-600",
  neutral: "bg-neutral-100 text-ink-secondary",
};

interface StatDef {
  id: string;
  label: string;
  icon: LucideIcon;
  tone: Tone;
  value: (assets: Asset[]) => number;
  sub: string;
}

const STATS: StatDef[] = [
  {
    id: "total",
    label: "Total Assets",
    icon: Layers,
    tone: "green",
    value: (list) => list.length,
    sub: "Synced with campaigns",
  },
  {
    id: "images",
    label: "Images",
    icon: Image,
    tone: "pink",
    value: (list) => list.filter((a) => a.type === "image").length,
    sub: "Feed & ad creatives",
  },
  {
    id: "videos",
    label: "Videos",
    icon: Video,
    tone: "violet",
    value: (list) => list.filter((a) => a.type === "video").length,
    sub: "Reels & TikToks",
  },
  {
    id: "carousels",
    label: "Carousels & Stories",
    icon: GalleryHorizontalEnd,
    tone: "blue",
    value: (list) => list.filter((a) => a.type === "carousel" || a.type === "story").length,
    sub: "Multi-frame formats",
  },
  {
    id: "pending",
    label: "Pending Review",
    icon: Clock,
    tone: "amber",
    value: (list) => list.filter((a) => a.status === "pending-review").length,
    sub: "Awaiting approval",
  },
  {
    id: "published",
    label: "Published",
    icon: CircleCheck,
    tone: "teal",
    value: (list) => list.filter((a) => a.status === "published").length,
    sub: "Live on platforms",
  },
];

export function AssetStats({ assets }: { assets: Asset[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
      {STATS.map(({ id, label, icon: Icon, tone, value, sub }) => (
        <article key={id} className="surface flex items-start gap-3 p-4">
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-full",
              TONE_CHIP[tone],
            )}
          >
            <Icon className="size-4.5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h3 className="text-xs leading-tight font-medium text-ink-muted">{label}</h3>
            <p className="mt-1 text-2xl leading-none font-bold tracking-tight">
              {value(assets).toLocaleString()}
            </p>
            <p className="mt-1.5 text-xs leading-tight text-ink-muted">{sub}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
