import { X, type LucideIcon } from "lucide-react";
import { cn } from "../../lib/cn";

export interface BulkAction {
  label: string;
  icon: LucideIcon;
  danger?: boolean;
  onSelect: () => void;
}

interface BulkActionBarProps {
  count: number;
  noun: string; // e.g. "asset" — pluralized automatically in the label
  actions: BulkAction[];
  onClear: () => void;
}

/** Sticky bottom toolbar shown while items are multi-selected. */
export function BulkActionBar({ count, noun, actions, onClear }: BulkActionBarProps) {
  if (count === 0) return null;

  return (
    <div className="surface fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 py-2 pr-2 pl-4 shadow-lift">
      <span className="mr-2 text-sm font-semibold whitespace-nowrap">
        {count} {noun}
        {count === 1 ? "" : "s"} selected
      </span>
      {actions.map(({ label, icon: Icon, danger, onSelect }) => (
        <button
          key={label}
          type="button"
          onClick={onSelect}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-accent",
            danger
              ? "text-danger hover:bg-red-50"
              : "text-ink-secondary hover:bg-canvas hover:text-ink",
          )}
        >
          <Icon className="size-4" aria-hidden />
          {label}
        </button>
      ))}
      <button
        type="button"
        aria-label="Clear selection"
        onClick={onClear}
        className="ml-1 rounded-lg p-2 text-ink-muted transition-colors hover:bg-neutral-100 hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}
