import { useEffect, useRef, useState } from "react";
import { workspace } from "../../data/mock";
import { Field, inputClasses } from "../ui/Field";

const BRAND_VOICES = [
  "Warm & Artisanal",
  "Bold & Energetic",
  "Calm & Premium",
  "Playful & Friendly",
];

export function WorkspaceSection({ onSave }: { onSave: (message: string) => void }) {
  const [name, setName] = useState(workspace.name);
  const [slug, setSlug] = useState("kafe-iko");
  const [voice, setVoice] = useState(BRAND_VOICES[0] ?? "");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    onSave("Demo workspace — deletion is disabled.");
  };

  return (
    <div className="space-y-6">
      <section className="surface p-6">
        <h2 className="text-[17px] font-semibold">Workspace</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Settings that apply to everyone in this workspace.
        </p>

        <div className="mt-5 flex items-center gap-4">
          <img src={workspace.logoUrl} alt="" className="size-14 rounded-xl object-cover" />
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
            onClick={() => onSave(`Workspace “${name.trim() || workspace.name}” saved.`)}
            className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-accent-deep"
          >
            Save changes
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
