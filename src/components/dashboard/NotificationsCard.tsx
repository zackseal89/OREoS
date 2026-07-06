import { CircleCheck, Info, Sparkles, TriangleAlert, type LucideIcon } from "lucide-react";
import { cn } from "../../lib/cn";
import type { NotificationItem, NotificationKind } from "../../types";

const KIND_STYLE: Record<NotificationKind, { icon: LucideIcon; chip: string }> = {
  success: { icon: CircleCheck, chip: "bg-accent-soft text-accent-deep" },
  warning: { icon: TriangleAlert, chip: "bg-warn-soft text-warn" },
  ai: { icon: Sparkles, chip: "bg-violet-50 text-violet-600" },
  info: { icon: Info, chip: "bg-info-soft text-info" },
};

export function NotificationsCard({ items }: { items: NotificationItem[] }) {
  return (
    <section aria-labelledby="notifications-title" className="surface p-6">
      <header className="mb-4 flex items-center justify-between">
        <h2 id="notifications-title" className="text-[17px] font-semibold">
          Recent Notifications
        </h2>
        <button
          type="button"
          className="text-[13px] font-medium text-info transition-colors hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-accent"
        >
          View All
        </button>
      </header>

      {items.length === 0 ? (
        <p className="text-sm text-ink-muted">You're all caught up.</p>
      ) : (
        <ul className="space-y-4">
          {items.map((item) => {
            const { icon: Icon, chip } = KIND_STYLE[item.kind] ?? KIND_STYLE.info;
            return (
              <li key={item.id} className="flex items-start gap-3">
                <span
                  className={cn(
                    "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                    chip,
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-sm leading-snug text-ink-secondary">{item.message}</p>
                  <p className="mt-1 text-xs text-ink-muted">{item.timeAgo}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
