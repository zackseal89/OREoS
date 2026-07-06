import { Bell, Search, Sparkles } from "lucide-react";

export function TopNav({ notificationCount }: { notificationCount: number }) {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-canvas/80 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-4 px-8 py-3.5">
        {/* Search */}
        <label className="relative block w-full max-w-sm">
          <span className="sr-only">Search</span>
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-muted"
            aria-hidden
          />
          <input
            type="search"
            placeholder="Search anything..."
            className="w-full rounded-xl border border-line bg-card py-2.5 pr-14 pl-10 text-sm placeholder:text-ink-muted focus:border-accent focus:outline-2 focus:outline-accent/30"
          />
          <kbd className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded-md border border-line bg-canvas px-1.5 py-0.5 font-sans text-[11px] text-ink-muted">
            ⌘ K
          </kbd>
        </label>

        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl border border-line bg-card px-4 py-2.5 text-sm font-semibold transition-transform hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-accent"
          >
            <Sparkles className="size-4 text-accent" aria-hidden />
            Upgrade Plan
          </button>

          <button
            type="button"
            aria-label={`Notifications (${notificationCount} unread)`}
            className="relative rounded-xl p-2.5 transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-accent"
          >
            <Bell className="size-5 text-ink-secondary" aria-hidden />
            {notificationCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex size-4.5 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
                {notificationCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
