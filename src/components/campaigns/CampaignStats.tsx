import {
  CalendarDays,
  CircleCheck,
  FileText,
  Image,
  Megaphone,
  TrendingUp,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../../lib/cn";
import type { Campaign, Tone } from "../../types";

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
  value: (campaigns: Campaign[]) => string;
  sub: { text: string; trend?: boolean } | null;
}

const STATS: StatDef[] = [
  {
    id: "total",
    label: "Total Campaigns",
    icon: Megaphone,
    tone: "green",
    value: (list) => String(list.length),
    sub: { text: "All campaigns" },
  },
  {
    id: "active",
    label: "Active Campaigns",
    icon: Zap,
    tone: "violet",
    value: (list) => String(list.filter((c) => c.status === "active").length),
    sub: { text: "Currently running" },
  },
  {
    id: "completed",
    label: "Completed",
    icon: CircleCheck,
    tone: "blue",
    value: (list) => String(list.filter((c) => c.status === "completed").length),
    sub: { text: "Finished" },
  },
  {
    id: "drafts",
    label: "Drafts",
    icon: FileText,
    tone: "neutral",
    value: (list) => String(list.filter((c) => c.status === "draft").length),
    sub: { text: "—" },
  },
  {
    id: "assets",
    label: "Total Assets",
    icon: Image,
    tone: "pink",
    value: (list) => list.reduce((sum, c) => sum + c.assets, 0).toLocaleString(),
    sub: { text: "Images, videos, carousels" },
  },
  {
    id: "scheduled",
    label: "Scheduled Posts",
    icon: CalendarDays,
    tone: "amber",
    value: (list) => list.reduce((sum, c) => sum + c.scheduled, 0).toLocaleString(),
    sub: { text: "Across all platforms" },
  },
];

export function CampaignStats({ campaigns }: { campaigns: Campaign[] }) {
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
              {value(campaigns)}
            </p>
            {sub && (
              <p
                className={cn(
                  "mt-1.5 flex items-start gap-1 text-xs leading-tight",
                  sub.trend ? "text-accent" : "text-ink-muted",
                )}
              >
                {sub.trend && <TrendingUp className="size-3.5 shrink-0" aria-hidden />}
                <span>{sub.text}</span>
              </p>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
