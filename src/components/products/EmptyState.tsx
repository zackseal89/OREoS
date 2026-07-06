import { Package, Plus } from "lucide-react";

interface EmptyStateProps {
  filtered: boolean;
  onCreate: () => void;
}

export function EmptyState({ filtered, onCreate }: EmptyStateProps) {
  return (
    <div className="surface col-span-full flex flex-col items-center justify-center px-6 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-accent-soft text-accent-deep">
        <Package className="size-6" aria-hidden />
      </span>
      <h3 className="mt-4 text-lg font-semibold">
        {filtered ? "No products match" : "No products yet."}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-ink-muted">
        {filtered
          ? "Try a different search or switch tabs."
          : "Add your first product to start building a brand dossier."}
      </p>
      {!filtered && (
        <button
          type="button"
          onClick={onCreate}
          className="mt-5 flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-accent-deep"
        >
          <Plus className="size-4" aria-hidden />
          Add Product
        </button>
      )}
    </div>
  );
}
