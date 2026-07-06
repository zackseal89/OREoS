import { CircleAlert, CircleCheck, Loader2, Package, type LucideIcon } from "lucide-react";
import { cn } from "../../lib/cn";
import type { Product, Tone } from "../../types";

interface StatDef {
  id: string;
  label: string;
  icon: LucideIcon;
  tone: Tone;
  value: (products: Product[]) => string;
}

const STATS: StatDef[] = [
  {
    id: "total",
    label: "Total Products",
    icon: Package,
    tone: "green",
    value: (list) => String(list.length),
  },
  {
    id: "ready",
    label: "Ready",
    icon: CircleCheck,
    tone: "blue",
    value: (list) => String(list.filter((p) => p.status === "ready").length),
  },
  {
    id: "processing",
    label: "Processing",
    icon: Loader2,
    tone: "violet",
    value: (list) => String(list.filter((p) => p.status === "processing").length),
  },
  {
    id: "needs-review",
    label: "Needs Review",
    icon: CircleAlert,
    tone: "amber",
    value: (list) => String(list.filter((p) => p.status === "needs-review").length),
  },
];

const TONE_CHIP: Record<Tone, string> = {
  green: "bg-accent-soft text-accent-deep",
  blue: "bg-info-soft text-info",
  violet: "bg-violet-50 text-violet-600",
  amber: "bg-warn-soft text-warn",
  pink: "bg-pink-50 text-pink-600",
  teal: "bg-teal-50 text-teal-600",
  neutral: "bg-neutral-100 text-ink-secondary",
};

export function ProductStats({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {STATS.map(({ id, label, icon: Icon, tone, value }) => (
        <article key={id} className="surface flex items-center gap-3.5 p-5">
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-full",
              TONE_CHIP[tone],
            )}
          >
            <Icon className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-[26px] leading-tight font-bold tracking-tight">{value(products)}</p>
            <h3 className="truncate text-[13px] font-medium text-ink-muted">{label}</h3>
          </div>
        </article>
      ))}
    </div>
  );
}
