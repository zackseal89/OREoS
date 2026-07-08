import { X } from "lucide-react";
import { cn } from "../../lib/cn";
import type { CampaignFilters, CampaignStatus, Platform } from "../../types";

const STATUS_OPTIONS: Array<{ value: CampaignStatus; label: string }> = [
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

const PLATFORM_OPTIONS: Array<{ value: Platform; label: string }> = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "linkedin", label: "LinkedIn" },
];

const COMING_SOON_PLATFORMS = ["Pinterest", "Threads"];

interface FilterDrawerProps {
  open: boolean;
  filters: CampaignFilters;
  products: string[];
  owners: string[];
  onChange: (filters: CampaignFilters) => void;
  onClear: () => void;
  onClose: () => void;
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function SectionTitle({ children }: { children: string }) {
  return (
    <h3 className="text-xs font-semibold tracking-wide text-ink-muted uppercase">{children}</h3>
  );
}

const checkboxClasses = "size-4 cursor-pointer rounded accent-accent";
const selectClasses =
  "w-full rounded-xl border border-line bg-card px-3 py-2 text-sm focus:border-accent focus:outline-2 focus:outline-accent/30";

export function FilterDrawer({
  open,
  filters,
  products,
  owners,
  onChange,
  onClear,
  onClose,
}: FilterDrawerProps) {
  return (
    <>
      {/* Scrim */}
      <div
        aria-hidden
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-30 bg-ink/20 transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Filter campaigns"
        className={cn(
          "fixed top-0 right-0 z-40 flex h-full w-[340px] max-w-full flex-col border-l border-line bg-card shadow-lift transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <header className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-[17px] font-semibold">Filters</h2>
          <button
            type="button"
            aria-label="Close filters"
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-neutral-100 hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
          >
            <X className="size-4.5" aria-hidden />
          </button>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          <section className="space-y-2.5">
            <SectionTitle>Status</SectionTitle>
            {STATUS_OPTIONS.map(({ value, label }) => (
              <label key={value} className="flex cursor-pointer items-center gap-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={filters.statuses.includes(value)}
                  onChange={() => onChange({ ...filters, statuses: toggle(filters.statuses, value) })}
                  className={checkboxClasses}
                />
                {label}
              </label>
            ))}
          </section>

          <section className="space-y-2.5 border-t border-line pt-5">
            <SectionTitle>Platforms</SectionTitle>
            {PLATFORM_OPTIONS.map(({ value, label }) => (
              <label key={value} className="flex cursor-pointer items-center gap-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={filters.platforms.includes(value)}
                  onChange={() =>
                    onChange({ ...filters, platforms: toggle(filters.platforms, value) })
                  }
                  className={checkboxClasses}
                />
                {label}
              </label>
            ))}
            {COMING_SOON_PLATFORMS.map((label) => (
              <label key={label} className="flex items-center gap-2.5 text-sm text-ink-muted">
                <input type="checkbox" disabled className="size-4 rounded" />
                {label}
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium">
                  Soon
                </span>
              </label>
            ))}
          </section>

          <section className="space-y-2 border-t border-line pt-5">
            <SectionTitle>Product</SectionTitle>
            <select
              value={filters.product}
              onChange={(event) => onChange({ ...filters, product: event.target.value })}
              className={selectClasses}
            >
              <option value="all">All products</option>
              {products.map((product) => (
                <option key={product} value={product}>
                  {product}
                </option>
              ))}
            </select>
          </section>

          <section className="space-y-2 border-t border-line pt-5">
            <SectionTitle>Date Range</SectionTitle>
            <div className="flex items-center gap-2">
              <input
                type="date"
                aria-label="From date"
                value={filters.from}
                onChange={(event) => onChange({ ...filters, from: event.target.value })}
                className={selectClasses}
              />
              <span className="text-ink-muted">–</span>
              <input
                type="date"
                aria-label="To date"
                value={filters.to}
                onChange={(event) => onChange({ ...filters, to: event.target.value })}
                className={selectClasses}
              />
            </div>
          </section>

          <section className="space-y-2 border-t border-line pt-5">
            <SectionTitle>Owner</SectionTitle>
            <select
              value={filters.owner}
              onChange={(event) => onChange({ ...filters, owner: event.target.value })}
              className={selectClasses}
            >
              <option value="all">Anyone</option>
              {owners.map((owner) => (
                <option key={owner} value={owner}>
                  {owner}
                </option>
              ))}
            </select>
          </section>

          <section className="space-y-2.5 border-t border-line pt-5">
            <SectionTitle>Has Scheduled Posts</SectionTitle>
            {(
              [
                ["any", "Any"],
                ["yes", "Yes"],
                ["no", "No"],
              ] as const
            ).map(([value, label]) => (
              <label key={value} className="flex cursor-pointer items-center gap-2.5 text-sm">
                <input
                  type="radio"
                  name="has-scheduled"
                  checked={filters.hasScheduled === value}
                  onChange={() => onChange({ ...filters, hasScheduled: value })}
                  className="size-4 cursor-pointer accent-accent"
                />
                {label}
              </label>
            ))}
          </section>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-line px-6 py-4">
          <button
            type="button"
            onClick={onClear}
            className="text-sm font-medium text-ink-secondary transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-accent-deep"
          >
            Done
          </button>
        </footer>
      </aside>
    </>
  );
}
