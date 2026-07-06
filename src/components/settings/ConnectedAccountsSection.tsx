import { useState } from "react";
import { connectedAccounts as seedAccounts } from "../../data/settings";
import { Badge } from "../ui/Badge";
import { PlatformIcon } from "../ui/PlatformIcon";
import type { AccountStatus, ConnectedAccount, Platform } from "../../types";

const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
};

const STATUS_BADGE: Record<AccountStatus, { tone: "success" | "warning" | "neutral"; label: string }> = {
  connected: { tone: "success", label: "Connected" },
  expiring: { tone: "warning", label: "Expires soon" },
  disconnected: { tone: "neutral", label: "Not connected" },
};

const COMING_SOON = ["Pinterest", "Threads"];

export function ConnectedAccountsSection({ onSave }: { onSave: (message: string) => void }) {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>(seedAccounts);

  const setStatus = (platform: Platform, status: AccountStatus, handle?: string) => {
    setAccounts((current) =>
      current.map((account) =>
        account.platform === platform
          ? { ...account, status, handle: handle ?? account.handle }
          : account,
      ),
    );
  };

  const actionFor = (account: ConnectedAccount) => {
    const label = PLATFORM_LABELS[account.platform];
    switch (account.status) {
      case "connected":
        return {
          text: "Disconnect",
          handler: () => {
            setStatus(account.platform, "disconnected", "Not connected");
            onSave(`${label} disconnected.`);
          },
        };
      case "expiring":
        return {
          text: "Reconnect",
          handler: () => {
            setStatus(account.platform, "connected");
            onSave(`${label} reauthorized.`);
          },
        };
      case "disconnected":
        return {
          text: "Connect",
          handler: () => {
            setStatus(account.platform, "connected", `@kafeiko`);
            onSave(`${label} connected. OAuth flows arrive with the Firebase milestone.`);
          },
        };
    }
  };

  return (
    <section className="surface p-6">
      <h2 className="text-[17px] font-semibold">Connected Accounts</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Social platforms OREoS can publish to on your behalf.
      </p>

      <ul className="mt-5 divide-y divide-line">
        {accounts.map((account) => {
          const { tone, label } = STATUS_BADGE[account.status];
          const action = actionFor(account);
          return (
            <li key={account.platform} className="flex items-center gap-3.5 py-4">
              <PlatformIcon platform={account.platform} className="size-10 border-line" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{PLATFORM_LABELS[account.platform]}</p>
                <p className="truncate text-[13px] text-ink-muted">{account.handle}</p>
              </div>
              <Badge tone={tone} label={label} />
              <button
                type="button"
                onClick={action.handler}
                className="w-28 rounded-xl border border-line bg-card px-3.5 py-2 text-[13px] font-medium transition-transform hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-accent"
              >
                {action.text}
              </button>
            </li>
          );
        })}
        {COMING_SOON.map((label) => (
          <li key={label} className="flex items-center gap-3.5 py-4 opacity-60">
            <span className="flex size-10 items-center justify-center rounded-full border border-line bg-canvas text-[11px] font-semibold text-ink-muted">
              {label.slice(0, 2)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{label}</p>
              <p className="text-[13px] text-ink-muted">Coming soon</p>
            </div>
            <Badge tone="neutral" label="Soon" />
          </li>
        ))}
      </ul>
    </section>
  );
}
