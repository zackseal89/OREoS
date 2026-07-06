import {
  CalendarDays,
  ChevronRight,
  CirclePlus,
  Link,
  MessageCircle,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../../lib/cn";
import type { QuickActionItem } from "../../types";

const ACTION_STYLE: Record<string, { icon: LucideIcon; chip: string }> = {
  "qa-campaign": { icon: CirclePlus, chip: "bg-accent-soft text-accent-deep" },
  "qa-generate": { icon: Sparkles, chip: "bg-violet-50 text-violet-600" },
  "qa-url": { icon: Link, chip: "bg-info-soft text-info" },
  "qa-chat": { icon: MessageCircle, chip: "bg-pink-50 text-pink-600" },
  "qa-calendar": { icon: CalendarDays, chip: "bg-warn-soft text-warn" },
};

export function QuickActions({ actions }: { actions: QuickActionItem[] }) {
  return (
    <section aria-labelledby="quick-actions-title" className="surface p-6">
      <h2 id="quick-actions-title" className="mb-3 text-[17px] font-semibold">
        Quick Actions
      </h2>
      <ul className="space-y-1">
        {actions.map((action) => {
          const style = ACTION_STYLE[action.id] ?? ACTION_STYLE["qa-campaign"]!;
          const Icon = style.icon;
          return (
            <li key={action.id}>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-canvas focus-visible:outline-2 focus-visible:outline-accent"
              >
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full",
                    style.chip,
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{action.title}</span>
                  <span className="block truncate text-xs text-ink-muted">{action.subtitle}</span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-ink-muted" aria-hidden />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
