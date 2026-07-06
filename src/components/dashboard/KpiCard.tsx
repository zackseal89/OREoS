import {
  CalendarClock,
  ChartColumn,
  Heart,
  Layers,
  Megaphone,
  Send,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../../lib/cn";
import type { KpiStat, Tone } from "../../types";

const KPI_ICONS: Record<string, LucideIcon> = {
  campaigns: Megaphone,
  scheduled: CalendarClock,
  published: Send,
  reach: ChartColumn,
  engagement: Heart,
  credits: Layers,
};

const TONE_CHIP: Record<Tone, string> = {
  green: "bg-accent-soft text-accent-deep",
  blue: "bg-info-soft text-info",
  violet: "bg-violet-50 text-violet-600",
  amber: "bg-warn-soft text-warn",
  pink: "bg-pink-50 text-pink-600",
  teal: "bg-teal-50 text-teal-600",
  neutral: "bg-neutral-100 text-ink-secondary",
};

export function KpiCard({ stat }: { stat: KpiStat }) {
  const Icon = KPI_ICONS[stat.id] ?? Megaphone;
  return (
    <article className="surface surface-hover p-5">
      <span
        className={cn(
          "mb-4 flex size-10 items-center justify-center rounded-xl",
          TONE_CHIP[stat.tone],
        )}
      >
        <Icon className="size-5" aria-hidden />
      </span>
      <h3 className="text-[13px] font-medium text-ink-muted">{stat.label}</h3>
      <p className="mt-1 text-[28px] leading-tight font-bold tracking-tight">{stat.value}</p>
      <p
        className={cn(
          "mt-1.5 flex items-center gap-1 text-xs",
          stat.trend === "up" ? "text-accent" : "text-ink-muted",
        )}
      >
        {stat.trend === "up" && <TrendingUp className="size-3.5" aria-hidden />}
        {stat.trendLabel}
      </p>
    </article>
  );
}
