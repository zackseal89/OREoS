import { Bell, CircleHelp } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { cn } from "../lib/cn";
import { useToast } from "../hooks/useToast";
import { BillingSection } from "../components/settings/BillingSection";
import { ConnectedAccountsSection } from "../components/settings/ConnectedAccountsSection";
import { NotificationsSection } from "../components/settings/NotificationsSection";
import { ProfileSection } from "../components/settings/ProfileSection";
import { TeamSection } from "../components/settings/TeamSection";
import { WorkspaceSection } from "../components/settings/WorkspaceSection";

const TABS = [
  { id: "profile", label: "Profile" },
  { id: "workspace", label: "Workspace" },
  { id: "team", label: "Team" },
  { id: "notifications", label: "Notifications" },
  { id: "accounts", label: "Connected Accounts" },
  { id: "billing", label: "Billing" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function isTabId(value: string | null): value is TabId {
  return TABS.some((tab) => tab.id === value);
}

export function SettingsPage() {
  const [params, setParams] = useSearchParams();
  const tabParam = params.get("tab");
  const tab: TabId = isTabId(tabParam) ? tabParam : "profile";
  const { toast, showToast } = useToast();

  const selectTab = (id: TabId) => {
    setParams(id === "profile" ? {} : { tab: id }, { replace: true });
  };

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

      <div className="mx-auto max-w-[880px] px-8 pt-2 pb-16">
        {/* Header */}
        <h1 className="text-[34px] font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-[15px] text-ink-muted">
          Manage your profile, workspace, team and billing.
        </p>

        {/* Tabs */}
        <div
          role="tablist"
          aria-label="Settings sections"
          className="mt-6 flex gap-6 overflow-x-auto border-b border-line"
        >
          {TABS.map(({ id, label }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => selectTab(id)}
                className={cn(
                  "relative pb-3 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-accent",
                  active ? "text-accent-deep" : "text-ink-muted hover:text-ink",
                )}
              >
                {label}
                <span
                  aria-hidden
                  className={cn(
                    "absolute right-0 bottom-0 left-0 h-0.5 origin-left rounded-full bg-accent transition-transform duration-300",
                    active ? "scale-x-100" : "scale-x-0",
                  )}
                />
              </button>
            );
          })}
        </div>

        {/* Active section */}
        <div className="mt-6">
          {tab === "profile" && <ProfileSection onSave={showToast} />}
          {tab === "workspace" && <WorkspaceSection onSave={showToast} />}
          {tab === "team" && <TeamSection onSave={showToast} />}
          {tab === "notifications" && <NotificationsSection />}
          {tab === "accounts" && <ConnectedAccountsSection onSave={showToast} />}
          {tab === "billing" && <BillingSection onSave={showToast} />}
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
