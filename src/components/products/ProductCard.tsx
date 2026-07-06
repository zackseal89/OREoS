import { useRef, useState } from "react";
import { Archive, Ellipsis, Megaphone, Trash2, type LucideIcon } from "lucide-react";
import { cn } from "../../lib/cn";
import { useClickOutside } from "../../hooks/useClickOutside";
import { ProductStatusBadge } from "../ui/Badge";
import { Highlight } from "../ui/Highlight";
import type { Product } from "../../types";

interface ProductCardProps {
  product: Product;
  query: string;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onOpen: (product: Product) => void;
  onCreateCampaign: (product: Product) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}

interface MenuAction {
  label: string;
  icon: LucideIcon;
  danger?: boolean;
  onSelect: () => void;
}

export function ProductCard({
  product,
  query,
  selected,
  onToggleSelect,
  onOpen,
  onCreateCampaign,
  onArchive,
  onDelete,
}: ProductCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useClickOutside(menuRef, () => setMenuOpen(false), menuOpen);

  const menuActions: MenuAction[] = [
    { label: "Archive", icon: Archive, onSelect: () => onArchive(product.id) },
    { label: "Delete", icon: Trash2, danger: true, onSelect: () => onDelete(product.id) },
  ];

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Open ${product.name}`}
      onClick={() => onOpen(product)}
      onKeyDown={(event) => {
        if (event.key === "Enter" && event.target === event.currentTarget) {
          onOpen(product);
        }
      }}
      className={cn(
        "surface surface-hover group flex cursor-pointer flex-col overflow-hidden text-left focus-visible:outline-2 focus-visible:outline-accent",
        selected && "ring-2 ring-accent",
      )}
    >
      {/* Cover */}
      <div className="relative aspect-video overflow-hidden bg-neutral-100">
        <img
          src={product.coverUrl}
          alt=""
          loading="lazy"
          className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
        />

        <div className="absolute top-3 left-3 flex items-center gap-2">
          <input
            type="checkbox"
            checked={selected}
            aria-label={`Select ${product.name}`}
            onClick={(event) => event.stopPropagation()}
            onChange={() => onToggleSelect(product.id)}
            className={cn(
              "size-4.5 cursor-pointer rounded accent-accent transition-opacity",
              selected ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
            )}
          />
          <ProductStatusBadge status={product.status} />
        </div>

        <div ref={menuRef} className="absolute top-3 right-3">
          <button
            type="button"
            aria-label={`More actions for ${product.name}`}
            aria-expanded={menuOpen}
            onClick={(event) => {
              event.stopPropagation();
              setMenuOpen((open) => !open);
            }}
            className="flex size-8 items-center justify-center rounded-full bg-card/90 text-ink-secondary shadow-card backdrop-blur-sm transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
          >
            <Ellipsis className="size-4" aria-hidden />
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="surface absolute right-0 z-20 mt-1.5 w-40 p-1.5"
              onClick={(event) => event.stopPropagation()}
            >
              {menuActions.map(({ label, icon: Icon, danger, onSelect }) => (
                <button
                  key={label}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onSelect();
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-accent",
                    danger ? "text-danger hover:bg-red-50" : "text-ink-secondary hover:bg-canvas hover:text-ink",
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-semibold">
          <Highlight text={product.name} query={query} />
        </h3>
        <p className="mt-1 text-sm text-ink-muted">
          {product.brand} · {product.category}
        </p>

        <p className="mt-3 border-b border-line pb-3 text-[13px] text-ink-muted">
          {product.linkedCampaigns} linked campaign{product.linkedCampaigns === 1 ? "" : "s"}
        </p>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onCreateCampaign(product);
          }}
          className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-line bg-card px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-accent"
        >
          <Megaphone className="size-4" aria-hidden />
          Create Campaign
        </button>
      </div>
    </article>
  );
}
