import { useState } from "react";
import { Toggle } from "../ui/Toggle";
import type { NotificationPref } from "../../types";

// Which events OREoS can notify on. Defaults; per-user persistence lands with the
// notification_prefs table wiring.
const DEFAULT_PREFS: NotificationPref[] = [
  { id: "pref-published", label: "Post published", description: "When a scheduled post goes live on any platform.", enabled: true },
  { id: "pref-failed", label: "Post failed", description: "When a post could not be published and needs attention.", enabled: true },
  { id: "pref-ai", label: "AI recommendations", description: "When OREoS finds a new campaign or content opportunity.", enabled: true },
  { id: "pref-digest", label: "Weekly performance digest", description: "A summary of your top posts every Monday.", enabled: false },
  { id: "pref-product", label: "Product updates", description: "Occasional news about new OREoS features.", enabled: false },
];

export function NotificationsSection() {
  const [prefs, setPrefs] = useState<NotificationPref[]>(DEFAULT_PREFS);

  const toggle = (id: string, enabled: boolean) => {
    setPrefs((current) =>
      current.map((pref) => (pref.id === id ? { ...pref, enabled } : pref)),
    );
  };

  return (
    <section className="surface p-6">
      <h2 className="text-[17px] font-semibold">Notifications</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Choose what OREoS emails you about. Changes apply instantly.
      </p>

      <ul className="mt-5 divide-y divide-line">
        {prefs.map((pref) => (
          <li key={pref.id} className="flex items-center justify-between gap-6 py-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold">{pref.label}</p>
              <p className="mt-0.5 text-[13px] text-ink-muted">{pref.description}</p>
            </div>
            <Toggle
              checked={pref.enabled}
              onChange={(enabled) => toggle(pref.id, enabled)}
              label={pref.label}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
