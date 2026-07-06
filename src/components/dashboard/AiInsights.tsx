import { BookOpen, Clapperboard, Clock, Sparkles, type LucideIcon } from "lucide-react";
import { cn } from "../../lib/cn";
import { PlatformIcon } from "../ui/PlatformIcon";
import type { InsightItem, Tone } from "../../types";

const TONE_CHIP: Record<Tone, string> = {
  green: "bg-accent-soft text-accent-deep",
  blue: "bg-info-soft text-info",
  violet: "bg-violet-50 text-violet-600",
  amber: "bg-warn-soft text-warn",
  pink: "bg-pink-50 text-pink-600",
  teal: "bg-teal-50 text-teal-600",
  neutral: "bg-neutral-100 text-ink-secondary",
};

const INSIGHT_ICONS: Record<string, LucideIcon> = {
  "insight-content": BookOpen,
  "insight-time": Clock,
  "insight-reels": Clapperboard,
};

function InsightIcon({ insight }: { insight: InsightItem }) {
  // The platform insight shows the real Instagram glyph; others use lucide icons.
  if (insight.id === "insight-platform") {
    return <PlatformIcon platform="instagram" variant="glyph" className="size-4" />;
  }
  const Icon = INSIGHT_ICONS[insight.id] ?? Sparkles;
  return <Icon className="size-4" aria-hidden />;
}

export function AiInsights({ insights }: { insights: InsightItem[] }) {
  return (
    <section aria-labelledby="ai-insights-title" className="surface p-6">
      <header className="mb-5 flex items-center justify-between gap-4">
        <h2 id="ai-insights-title" className="flex items-center gap-2 text-[17px] font-semibold">
          <Sparkles className="size-4.5 text-accent" aria-hidden />
          AI Insights
        </h2>
        <button
          type="button"
          className="rounded-xl border border-line bg-card px-3.5 py-2 text-[13px] font-medium whitespace-nowrap transition-transform hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-accent"
        >
          View Full Analytics
        </button>
      </header>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4 xl:divide-x xl:divide-line">
        {insights.map((insight) => (
          <div key={insight.id} className="flex items-start gap-3 xl:pr-6">
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-full",
                TONE_CHIP[insight.tone],
              )}
            >
              <InsightIcon insight={insight} />
            </span>
            <div className="min-w-0">
              <p className="text-sm leading-snug text-ink-secondary">{insight.message}</p>
              <p className="mt-0.5 text-xs font-medium text-ink-muted">({insight.detail})</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
