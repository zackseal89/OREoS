import { useState } from "react";
import { currentUser } from "../../data/mock";
import { Field, inputClasses } from "../ui/Field";

const TIMEZONES = [
  "Africa/Nairobi (EAT)",
  "Europe/London (GMT)",
  "America/New_York (EST)",
  "Asia/Dubai (GST)",
];

const saveButtonClasses =
  "rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-accent-deep";

export function ProfileSection({ onSave }: { onSave: (message: string) => void }) {
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [timezone, setTimezone] = useState(TIMEZONES[0] ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  return (
    <div className="space-y-6">
      <section className="surface p-6">
        <h2 className="text-[17px] font-semibold">Profile</h2>
        <p className="mt-1 text-sm text-ink-muted">How you appear across your workspace.</p>

        <div className="mt-5 flex items-center gap-4">
          <span className="flex size-16 items-center justify-center rounded-full bg-accent-soft text-xl font-semibold text-accent-deep">
            {currentUser.initials}
          </span>
          <button
            type="button"
            onClick={() => onSave("Photo upload arrives with the Firebase Storage milestone.")}
            className="rounded-xl border border-line bg-card px-3.5 py-2 text-[13px] font-medium transition-transform hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-accent"
          >
            Change photo
          </button>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="Full name">
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={inputClasses}
            />
          </Field>
          <Field label="Email" hint="Used for sign-in and notifications.">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClasses}
            />
          </Field>
          <Field label="Timezone" hint="Post scheduling uses this timezone.">
            <select
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
              className={inputClasses}
            >
              {TIMEZONES.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Workspace role">
            <input type="text" value="Owner" disabled className={inputClasses} />
          </Field>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => onSave(`Profile saved for ${name.trim() || "you"}.`)}
            className={saveButtonClasses}
          >
            Save changes
          </button>
        </div>
      </section>

      <section className="surface p-6">
        <h2 className="text-[17px] font-semibold">Password</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Choose a strong password you don't use anywhere else.
        </p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field label="Current password">
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              className={inputClasses}
            />
          </Field>
          <Field label="New password" hint="At least 8 characters.">
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              className={inputClasses}
            />
          </Field>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => {
              if (newPassword.length < 8) {
                onSave("New password must be at least 8 characters.");
                return;
              }
              setCurrentPassword("");
              setNewPassword("");
              onSave("Password updated.");
            }}
            className={saveButtonClasses}
          >
            Update password
          </button>
        </div>
      </section>
    </div>
  );
}
