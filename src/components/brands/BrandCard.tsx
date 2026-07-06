import { Palette } from "lucide-react";
import type { Brand } from "../../types";

interface BrandCardProps {
  brand: Brand;
  productCount: number;
  campaignCount: number;
  onManage: (brand: Brand) => void;
}

export function BrandCard({ brand, productCount, campaignCount, onManage }: BrandCardProps) {
  return (
    <article className="surface surface-hover flex flex-col p-6">
      <div className="flex items-center gap-3">
        <img
          src={brand.logoUrl}
          alt=""
          className="size-12 shrink-0 rounded-xl object-cover"
          loading="lazy"
        />
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold">{brand.name}</h3>
          <p className="truncate text-sm text-ink-muted">{brand.industry}</p>
        </div>
      </div>

      <div className="mt-5 flex gap-2.5">
        {brand.colors.map((hex) => (
          <span
            key={hex}
            className="size-8 rounded-full border border-line"
            style={{ backgroundColor: hex }}
            title={hex}
          />
        ))}
      </div>

      <div className="mt-5 border-t border-line pt-4">
        <p className="text-lg font-bold">{brand.typographyHeadline}</p>
        <p className="mt-1.5 text-sm text-ink-secondary italic">“{brand.voiceSummary}”</p>
      </div>

      <p className="mt-4 text-[13px] text-ink-muted">
        {productCount} product{productCount === 1 ? "" : "s"} · {campaignCount} campaign
        {campaignCount === 1 ? "" : "s"}
      </p>

      <button
        type="button"
        onClick={() => onManage(brand)}
        className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-accent"
      >
        <Palette className="size-4" aria-hidden />
        Manage Brand
      </button>
    </article>
  );
}
