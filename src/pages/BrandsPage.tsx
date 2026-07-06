import { useEffect, useRef, useState } from "react";
import { Bell, CircleHelp, Plus } from "lucide-react";
import { brands as seedBrands } from "../data/brands";
import { products } from "../data/products";
import { campaigns } from "../data/campaigns";
import { BrandCard } from "../components/brands/BrandCard";
import type { Brand } from "../types";

function CreateBrandCard({ onCreate }: { onCreate: () => void }) {
  return (
    <button
      type="button"
      onClick={onCreate}
      className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-[20px] border-2 border-dashed border-line p-6 text-center transition-colors hover:border-accent hover:bg-accent-soft/40 focus-visible:outline-2 focus-visible:outline-accent"
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-accent text-white">
        <Plus className="size-6" aria-hidden />
      </span>
      <span className="text-base font-semibold">Add Another Brand</span>
      <span className="max-w-52 text-sm text-ink-muted">
        For workspaces managing more than one company's identity
      </span>
    </button>
  );
}

export function BrandsPage() {
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = (message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };
  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const countsFor = (brand: Brand) => ({
    products: products.filter((p) => p.brand === brand.name).length,
    campaigns: campaigns.filter((c) => c.brand === brand.name).length,
  });

  return (
    <main className="relative flex-1">
      {/* Utility strip */}
      <div className="flex items-center justify-end gap-1.5 px-8 pt-4">
        <button
          type="button"
          aria-label="Notifications (3 unread)"
          className="relative rounded-xl p-2.5 transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-accent"
        >
          <Bell className="size-5 text-ink-secondary" aria-hidden />
          <span className="absolute top-0.5 right-0.5 flex size-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
            3
          </span>
        </button>
        <button
          type="button"
          aria-label="Help"
          className="rounded-xl p-2.5 transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-accent"
        >
          <CircleHelp className="size-5 text-ink-secondary" aria-hidden />
        </button>
      </div>

      <div className="mx-auto max-w-[1440px] space-y-6 px-8 pt-2 pb-10">
        {/* Header */}
        <div>
          <h1 className="text-[34px] font-bold tracking-tight">Brands</h1>
          <p className="mt-1 text-[15px] text-ink-muted">
            The identity every product and campaign stays consistent with.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {seedBrands.map((brand) => {
            const counts = countsFor(brand);
            return (
              <BrandCard
                key={brand.id}
                brand={brand}
                productCount={counts.products}
                campaignCount={counts.campaigns}
                onManage={(b) =>
                  showToast(`"${b.name}" opens the Brand Workspace — coming in a later milestone.`)
                }
              />
            );
          })}
          <CreateBrandCard
            onCreate={() => showToast("Adding another brand arrives in a later milestone.")}
          />
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <output className="surface fixed right-6 bottom-6 z-50 block px-4 py-3 text-sm font-medium shadow-lift">
          {toast}
        </output>
      )}
    </main>
  );
}
