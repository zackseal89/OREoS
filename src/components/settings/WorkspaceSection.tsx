import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import { coverFor } from "../../lib/cover";
import { useSession } from "../../context/SessionContext";
import { Field, inputClasses } from "../ui/Field";

const BRAND_VOICES = [
  "Warm & Artisanal",
  "Bold & Energetic",
  "Calm & Premium",
  "Playful & Friendly",
];

export function WorkspaceSection({ onSave }: { onSave: (message: string) => void }) {
  const { activeWorkspace } = useSession();
  const [name, setName] = useState(activeWorkspace?.name ?? "");
  const [slug, setSlug] = useState(activeWorkspace?.slug ?? "");
  const [voice, setVoice] = useState(activeWorkspace?.default_brand_voice ?? BRAND_VOICES[0] ?? "");
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync form when the active workspace resolves/changes.
  useEffect(() => {
    if (!activeWorkspace) return;
    setName(activeWorkspace.name);
    setSlug(activeWorkspace.slug);
    setVoice(activeWorkspace.default_brand_voice ?? BRAND_VOICES[0] ?? "");
  }, [activeWorkspace]);

  useEffect(
    () => () => {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
    },
    [],
  );

  const handleDelete = () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      confirmTimer.current = setTimeout(() => setConfirmingDelete(false), 4000);
      return;
    }
    setConfirmingDelete(false);
    onSave("Workspace deletion isn't available yet.");
  };

  const handleSaveChanges = async () => {
    if (!activeWorkspace) return;
    setSaving(true);
    const { error } = await supabase
      .from("workspaces")
      .update({ name: name.trim(), slug: slug.trim(), default_brand_voice: voice })
      .eq("id", activeWorkspace.id);
    setSaving(false);
    onSave(error ? `Couldn't save: ${error.message}` : `Workspace “${name.trim()}” saved.`);
  };

  return (
    <div className="space-y-6">
      <section className="surface p-6">
        <h2 className="text-[17px] font-semibold">Workspace</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Settings that apply to everyone in this workspace.
        </p>

        <div className="mt-5 flex items-center gap-4">
          <img
            src={activeWorkspace?.logo_url ?? coverFor(activeWorkspace?.id ?? "ws")}
            alt=""
            className="size-14 rounded-xl object-cover"
          />
          <button
            type="button"
            onClick={() => onSave("Logo upload arrives with the Firebase Storage milestone.")}
            className="rounded-xl border border-line bg-card px-3.5 py-2 text-[13px] font-medium transition-transform hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-accent"
          >
            Change logo
          </button>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="Workspace name">
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={inputClasses}
            />
          </Field>
          <Field label="Workspace URL" hint="aura.app/">
            <input
              type="text"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              className={inputClasses}
            />
          </Field>
          <Field
            label="Default brand voice"
            hint="New campaigns start with this voice. Extracted dossiers can override it."
          >
            <select
              value={voice}
              onChange={(event) => setVoice(event.target.value)}
              className={inputClasses}
            >
              {BRAND_VOICES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            disabled={saving}
            onClick={handleSaveChanges}
            className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-accent-deep"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </section>

      <section className="rounded-[20px] border border-danger/25 bg-card p-6 shadow-card">
        <h2 className="text-[17px] font-semibold text-danger">Danger zone</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Deleting a workspace removes all campaigns, products and generated assets. This cannot be
          undone.
        </p>
        <button
          type="button"
          onClick={handleDelete}
          className="mt-4 rounded-xl border border-danger/40 px-4 py-2.5 text-sm font-semibold text-danger transition-colors hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-danger"
        >
          {confirmingDelete ? "Click again to confirm deletion" : "Delete workspace"}
        </button>
      </section>
    </div>
  );
}
