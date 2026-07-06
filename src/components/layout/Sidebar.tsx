import { useState } from "react";
import {
  ChevronDown,
  ChevronsUpDown,
  CircleCheck,
  FolderOpen,
  House,
  Megaphone,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Store,
  type LucideIcon,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "../../lib/cn";
import { currentUser, workspace } from "../../data/mock";

interface SidebarNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Route path for pages that exist; omitted items render as inert placeholders. */
  to?: string;
  badge?: number;
}

const NAV_ITEMS: SidebarNavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: House, to: "/dashboard" },
  { id: "campaigns", label: "Campaigns", icon: Megaphone, to: "/campaigns" },
  { id: "products", label: "Products", icon: Package, to: "/products" },
  { id: "brands", label: "Brands", icon: Store, to: "/brands" },
  { id: "assets", label: "Assets Library", icon: FolderOpen, to: "/assets" },
  { id: "approvals", label: "Approvals", icon: CircleCheck, to: "/approvals" },
  { id: "settings", label: "Settings", icon: Settings, to: "/settings" },
];

const linkClasses = (active: boolean, collapsed: boolean) =>
  cn(
    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-accent",
    collapsed && "justify-center px-0",
    active
      ? "bg-accent-soft font-semibold text-accent-deep"
      : "text-ink-secondary hover:bg-neutral-100 hover:text-ink",
  );

function NavRow({ item, collapsed }: { item: SidebarNavItem; collapsed: boolean }) {
  const { label, icon: Icon, to, badge } = item;
  const hasBadge = badge !== undefined && badge > 0;

  const content = (
    <>
      <span className="relative flex shrink-0 items-center justify-center">
        <Icon className="size-[18px]" aria-hidden />
        {collapsed && hasBadge && (
          <span
            aria-hidden
            className="absolute -top-1 -right-1 size-2 rounded-full bg-accent"
          />
        )}
      </span>
      {!collapsed && (
        <>
          <span className="flex-1">{label}</span>
          {hasBadge && (
            <span className="flex size-5 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-white">
              {badge}
            </span>
          )}
        </>
      )}
    </>
  );

  if (to) {
    return (
      <NavLink
        to={to}
        end={to === "/"}
        title={collapsed ? label : undefined}
        aria-label={collapsed ? label : undefined}
        className={({ isActive }) => linkClasses(isActive, collapsed)}
      >
        {content}
      </NavLink>
    );
  }

  return (
    <a
      href="#"
      onClick={(event) => event.preventDefault()}
      title={collapsed ? label : undefined}
      aria-label={collapsed ? label : undefined}
      className={linkClasses(false, collapsed)}
    >
      {content}
    </a>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-line bg-card transition-[width] duration-200 ease-out lg:flex",
        collapsed ? "w-[76px]" : "w-[260px]",
      )}
    >
      {/* Brand */}
      <div
        className={cn(
          "flex items-center gap-2 px-5 pt-5 pb-4",
          collapsed ? "flex-col justify-center px-0" : "justify-between",
        )}
      >
        <NavLink
          to="/"
          className="flex items-center gap-2.5 rounded-xl focus-visible:outline-2 focus-visible:outline-accent"
        >
          <span className="text-xl font-bold tracking-tight">
            <span className="text-accent">O</span>
            {!collapsed && "REoS"}
          </span>
        </NavLink>
        <button
          type="button"
          onClick={() => setCollapsed((current) => !current)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-neutral-100 hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4" aria-hidden />
          ) : (
            <PanelLeftClose className="size-4" aria-hidden />
          )}
        </button>
      </div>

      {/* Workspace selector */}
      <div className={cn("pb-3", collapsed ? "px-3" : "px-4")}>
        <button
          type="button"
          title={collapsed ? `${workspace.name} — ${workspace.role}` : undefined}
          aria-label={collapsed ? `${workspace.name} — ${workspace.role}` : undefined}
          className={cn(
            "flex w-full items-center rounded-2xl border border-line bg-canvas text-left transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-accent",
            collapsed ? "justify-center p-2" : "gap-3 px-3 py-2.5",
          )}
        >
          <img
            src={workspace.logoUrl}
            alt=""
            className="size-9 shrink-0 rounded-lg object-cover"
            loading="lazy"
          />
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{workspace.name}</span>
                <span className="block text-xs text-ink-muted">{workspace.role}</span>
              </span>
              <ChevronDown className="size-4 shrink-0 text-ink-muted" aria-hidden />
            </>
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav
        aria-label="Main navigation"
        className={cn("flex-1 overflow-y-auto pb-4", collapsed ? "px-3" : "px-4")}
      >
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <li key={item.id}>
              <NavRow item={item} collapsed={collapsed} />
            </li>
          ))}
        </ul>
      </nav>

      {/* User footer */}
      <div className={cn("border-t border-line p-4", collapsed && "px-3")}>
        <button
          type="button"
          title={collapsed ? `${currentUser.name} — ${currentUser.email}` : undefined}
          aria-label={collapsed ? `${currentUser.name} — ${currentUser.email}` : undefined}
          className={cn(
            "flex w-full items-center rounded-2xl text-left transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-accent",
            collapsed ? "justify-center p-1.5" : "gap-3 px-2 py-1.5",
          )}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent-deep">
            {currentUser.initials}
          </span>
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{currentUser.name}</span>
                <span className="block truncate text-xs text-ink-muted">
                  {currentUser.email}
                </span>
              </span>
              <ChevronsUpDown className="size-4 shrink-0 text-ink-muted" aria-hidden />
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
