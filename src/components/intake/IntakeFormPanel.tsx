import { ArrowRight, Check, Loader2, Sparkles, Upload } from "lucide-react";
import { cn } from "../../lib/cn";
import type { IntakeStage, ProductSourceType } from "../../types";

const MODES: Array<{ value: ProductSourceType; label: string }> = [
  { value: "url", label: "Product URL" },
  { value: "upload", label: "Upload Image" },
];

const CHECKLIST = [
  "Visual identity — colors extracted",
  "Typography & voice — tone matched",
  "Core value props — key selling points found",
  "Product assets — images ready to reuse",
];

interface IntakeFormPanelProps {
  stage: IntakeStage;
  mode: ProductSourceType;
  onModeChange: (mode: ProductSourceType) => void;
  url: string;
  onUrlChange: (value: string) => void;
  fileName: string | null;
  onFileSelect: (file: File | null) => void;
  onSubmit: () => void;
  canSubmit: boolean;
  productName: string;
  onSave: () => void;
  onRestart: () => void;
  saving: boolean;
}

export function IntakeFormPanel({
  stage,
  mode,
  onModeChange,
  url,
  onUrlChange,
  fileName,
  onFileSelect,
  onSubmit,
  canSubmit,
  productName,
  onSave,
  onRestart,
  saving,
}: IntakeFormPanelProps) {
  if (stage === "input") {
    return (
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Add your first product</h1>
        <p className="mt-2 text-[15px] text-ink-muted">
          Paste a product link or upload an image — OREoS extracts your brand dossier
          automatically.
        </p>

        <div
          role="tablist"
          aria-label="Product source"
          className="mt-7 grid grid-cols-2 gap-1 rounded-xl bg-canvas p-1"
        >
          {MODES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={mode === value}
              onClick={() => onModeChange(value)}
              className={cn(
                "rounded-lg py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-accent",
                mode === value ? "bg-card text-ink shadow-card" : "text-ink-muted hover:text-ink",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-4">
          {mode === "url" ? (
            <label className="block">
              <span className="sr-only">Product URL</span>
              <input
                type="url"
                value={url}
                onChange={(event) => onUrlChange(event.target.value)}
                placeholder="Paste product URL here..."
                className="w-full rounded-xl border border-line bg-card px-4 py-3 text-sm placeholder:text-ink-muted focus:border-accent focus:outline-2 focus:outline-accent/30"
              />
            </label>
          ) : (
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line px-4 py-8 text-center transition-colors hover:border-accent hover:bg-accent-soft/30">
              <Upload className="size-5 text-ink-muted" aria-hidden />
              <span className="text-sm font-medium">
                {fileName ?? "Click to upload a product image"}
              </span>
              <span className="text-xs text-ink-muted">PNG or JPG, up to 10MB</span>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => onFileSelect(event.target.files?.[0] ?? null)}
              />
            </label>
          )}
        </div>

        <button
          type="button"
          disabled={!canSubmit}
          onClick={onSubmit}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:hover:scale-100 focus-visible:outline-2 focus-visible:outline-accent"
        >
          <Sparkles className="size-4" aria-hidden />
          Extract Assets
        </button>
      </div>
    );
  }

  if (stage === "extracting") {
    return (
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Extracting your brand dossier</h1>
        <p className="mt-2 text-[15px] text-ink-muted">
          This usually takes under a minute — hang tight while OREoS reads{" "}
          {productName || "your product"}.
        </p>
        <div className="mt-6 flex items-center gap-2.5 text-sm font-medium text-ink-secondary">
          <Loader2 className="size-4 animate-spin text-accent" aria-hidden />
          Analyzing…
        </div>
      </div>
    );
  }

  if (stage === "review") {
    return (
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent-deep">
          <Check className="size-3.5" aria-hidden />
          Extraction complete
        </span>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">{productName}</h1>
        <p className="mt-2 text-[15px] text-ink-muted">
          Review what OREoS found before adding it to your library.
        </p>

        <ul className="mt-6 space-y-3">
          {CHECKLIST.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm text-ink-secondary">
              <Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
              {item}
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-col gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={onSave}
            className="flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:hover:scale-100 focus-visible:outline-2 focus-visible:outline-accent-deep"
          >
            <ArrowRight className="size-4" aria-hidden />
            {saving ? "Saving…" : "Save to Product Library"}
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
          >
            Extract Again
          </button>
        </div>
      </div>
    );
  }

  // stage === "saved"
  return (
    <div>
      <span className="flex size-14 items-center justify-center rounded-full bg-accent-soft text-accent-deep">
        <Check className="size-6" aria-hidden />
      </span>
      <h1 className="mt-5 text-2xl font-bold tracking-tight">Saved to your Product Library</h1>
      <p className="mt-2 text-[15px] text-ink-muted">
        “{productName}” is ready to use in a campaign.
      </p>
      <button
        type="button"
        onClick={onRestart}
        className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.01] active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-accent"
      >
        Add Another Product
      </button>
    </div>
  );
}
