import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { initialsOf, useSession } from "../../context/SessionContext";
import { Field, inputClasses } from "../ui/Field";

// Stored as plain IANA-ish strings (profiles.timezone); handle_new_user
// defaults new users to Africa/Nairobi.
const TIMEZONES = ["Africa/Nairobi", "Europe/London", "America/New_York", "Asia/Dubai"];

const saveButtonClasses =
  "rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-accent-deep";

export function ProfileSection({ onSave }: { onSave: (message: string) => void }) {
  const { profile, role, refresh } = useSession();

  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState(TIMEZONES[0]!);
  const [newPassword, setNewPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Sync local form state once the profile loads.
  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setTimezone(profile.timezone);
    }
  }, [profile]);

  async function saveProfile() {
    if (!profile) return;
    setSavingProfile(true);
    const { error } = await supabase
      .from("profiles")
      .update({ name: name.trim(), timezone })
      .eq("id", profile.id);
    setSavingProfile(false);
    if (error) {
      onSave(error.message);
      return;
    }
    await refresh();
    onSave("Profile saved.");
  }

  async function updatePassword() {
    if (newPassword.length < 6) {
      onSave("New password must be at least 6 characters.");
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) {
      onSave(error.message);
      return;
    }
    setNewPassword("");
    onSave("Password updated.");
  }

  const roleLabel = role ? role.charAt(0).toUpperCase() + role.slice(1) : "—";

  return (
    <div className="space-y-6">
      <section className="surface p-6">
        <h2 className="text-[17px] font-semibold">Profile</h2>
        <p className="mt-1 text-sm text-ink-muted">How you appear across your workspace.</p>

        <div className="mt-5 flex items-center gap-4">
          <span className="flex size-16 items-center justify-center rounded-full bg-accent-soft text-xl font-semibold text-accent-deep">
            {initialsOf(profile?.name ?? profile?.email)}
          </span>
          <button
            type="button"
            onClick={() => onSave("Photo upload arrives with the Storage milestone.")}
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
          <Field label="Email" hint="Your sign-in address can't be changed here.">
            <input type="email" value={profile?.email ?? ""} disabled className={inputClasses} />
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
            <input type="text" value={roleLabel} disabled className={inputClasses} />
          </Field>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={saveProfile}
            disabled={savingProfile || !profile}
            className={saveButtonClasses}
          >
            {savingProfile ? "Saving…" : "Save changes"}
          </button>
        </div>
      </section>

      <section className="surface p-6">
        <h2 className="text-[17px] font-semibold">Password</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Choose a strong password you don't use anywhere else.
        </p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field label="New password" hint="At least 6 characters.">
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
            onClick={updatePassword}
            disabled={savingPassword}
            className={saveButtonClasses}
          >
            {savingPassword ? "Updating…" : "Update password"}
          </button>
        </div>
      </section>
    </div>
  );
}
