import { useRef, useState } from "react";
import {
  ChevronDown,
  ChevronsUpDown,
  CircleCheck,
  FolderOpen,
  House,
  LogOut,
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
import { initialsOf, useSession } from "../../context/SessionContext";
import { useClickOutside } from "../../hooks/useClickOutside";

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
          <span aria-hidden className="absolute -top-1 -right-1 size-2 rounded-full bg-accent" />
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useClickOutside(menuRef, () => setMenuOpen(false), menuOpen);

  const { session, profile, activeWorkspace, role, signOut } = useSession();

  const displayName = profile?.name ?? session?.user.email ?? "Your account";
  const email = profile?.email ?? session?.user.email ?? "";
  const wsName = activeWorkspace?.name ?? "Personal workspace";
  const roleLabel = role ? role.charAt(0).toUpperCase() + role.slice(1) : "Workspace";

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
          title={collapsed ? `${wsName} — ${roleLabel}` : undefined}
          aria-label={collapsed ? `${wsName} — ${roleLabel}` : undefined}
          className={cn(
            "flex w-full items-center rounded-2xl border border-line bg-canvas text-left transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-accent",
            collapsed ? "justify-center p-2" : "gap-3 px-3 py-2.5",
          )}
        >
          <WorkspaceAvatar name={wsName} logoUrl={activeWorkspace?.logo_url ?? null} />
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{wsName}</span>
                <span className="block text-xs text-ink-muted">{roleLabel}</span>
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
      <div ref={menuRef} className={cn("relative border-t border-line p-4", collapsed && "px-3")}>
        {menuOpen && (
          <div
            className={cn(
              "surface absolute z-20 p-1.5",
              collapsed ? "bottom-2 left-full ml-2 w-44" : "right-4 bottom-full left-4 mb-2",
            )}
          >
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                void signOut();
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-danger transition-colors hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-accent"
            >
              <LogOut className="size-4" aria-hidden />
              Sign out
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={() => setMenuOpen((current) => !current)}
          title={collapsed ? `${displayName} — ${email}` : undefined}
          aria-label={collapsed ? `${displayName} — ${email}` : undefined}
          aria-expanded={menuOpen}
          className={cn(
            "flex w-full items-center rounded-2xl text-left transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-accent",
            collapsed ? "justify-center p-1.5" : "gap-3 px-2 py-1.5",
          )}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent-deep">
            {initialsOf(profile?.name ?? email)}
          </span>
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{displayName}</span>
                <span className="block truncate text-xs text-ink-muted">{email}</span>
              </span>
              <ChevronsUpDown className="size-4 shrink-0 text-ink-muted" aria-hidden />
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

function WorkspaceAvatar({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt=""
        className="size-9 shrink-0 rounded-lg object-cover"
        loading="lazy"
      />
    );
  }
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-ink text-sm font-bold text-white">
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
