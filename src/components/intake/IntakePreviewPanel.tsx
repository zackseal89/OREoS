import { useEffect, useState, type ReactNode } from "react";
import { CircleCheck, ImageIcon, Sparkles } from "lucide-react";
import type { IntakeStage, ProductDossier, ProductSourceType } from "../../types";

interface IntakePreviewPanelProps {
  stage: IntakeStage;
  mode: ProductSourceType;
  url: string;
  file: File | null;
  caption: string;
  dossier: ProductDossier | null;
  productName: string;
}

function BrowserChrome({ children }: { children: ReactNode }) {
  return (
    <div className="surface w-full max-w-md overflow-hidden">
      <div className="flex items-center gap-1.5 border-b border-line bg-canvas px-4 py-3">
        <span className="size-2.5 rounded-full bg-red-400" />
        <span className="size-2.5 rounded-full bg-amber-400" />
        <span className="size-2.5 rounded-full bg-accent" />
      </div>
      <div className="relative aspect-[4/3] overflow-hidden">{children}</div>
    </div>
  );
}

export function IntakePreviewPanel({
  stage,
  mode,
  url,
  file,
  caption,
  dossier,
  productName,
}: IntakePreviewPanelProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setFileUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setFileUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  if (stage === "input" || stage === "extracting") {
    const scanning = stage === "extracting";

    if (mode === "upload") {
      return (
        <div className="flex w-full max-w-md flex-col items-center gap-4">
          <div className="surface relative aspect-square w-full overflow-hidden">
            {fileUrl ? (
              <img src={fileUrl} alt="" className="size-full object-cover" />
            ) : (
              <div className="flex size-full flex-col items-center justify-center gap-2 text-ink-muted">
                <ImageIcon className="size-8" aria-hidden />
                <span className="text-sm">Your image preview will appear here</span>
              </div>
            )}
            {scanning && (
              <div
                aria-hidden
                className="animate-scan absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-accent/25 to-transparent"
              />
            )}
          </div>
          {scanning && (
            <p className="flex items-center gap-2 text-sm font-medium text-ink-secondary">
              <Sparkles className="size-4 text-accent" aria-hidden />
              {caption}
            </p>
          )}
        </div>
      );
    }

    return (
      <div className="flex w-full max-w-md flex-col items-center gap-4">
        <BrowserChrome>
          <div className="absolute inset-x-0 top-0 z-10 border-b border-line bg-card px-3 py-2">
            <span className="block truncate rounded-md bg-canvas px-2.5 py-1 text-xs text-ink-muted">
              {url.trim() || "yourproductpage.com"}
            </span>
          </div>
          <div className="flex size-full flex-col items-center justify-center gap-2 bg-neutral-50 pt-10 text-ink-muted">
            <ImageIcon className="size-8" aria-hidden />
            <span className="text-sm">
              {url.trim() ? "Fetching page preview…" : "Your product page preview will appear here"}
            </span>
          </div>
          {scanning && (
            <div
              aria-hidden
              className="animate-scan absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-accent/25 to-transparent"
            />
          )}
        </BrowserChrome>
        {scanning && (
          <p className="flex items-center gap-2 text-sm font-medium text-ink-secondary">
            <Sparkles className="size-4 text-accent" aria-hidden />
            {caption}
          </p>
        )}
      </div>
    );
  }

  if (stage === "review" && dossier) {
    return (
      <div className="w-full max-w-2xl space-y-6">
        <div className="surface p-6">
          <h2 className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
            Extracted Assets
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {dossier.assetUrls.map((assetUrl) => (
              <div
                key={assetUrl}
                className="aspect-square overflow-hidden rounded-xl bg-neutral-100"
              >
                <img src={assetUrl} alt="" className="size-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <section className="surface p-6">
            <h2 className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
              Visual Identity
            </h2>
            <div className="mt-4 flex gap-3">
              {dossier.colors.map((hex) => (
                <div key={hex} className="flex flex-col items-center gap-1.5">
                  <span
                    className="size-10 rounded-full border border-line"
                    style={{ backgroundColor: hex }}
                  />
                  <span className="text-[11px] text-ink-muted">{hex}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="surface p-6">
            <h2 className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
              Typography & Voice
            </h2>
            <p className="mt-3 text-lg font-bold">{dossier.typographyHeadline}</p>
            <p className="mt-1.5 text-sm text-ink-secondary italic">“{dossier.voiceSummary}”</p>
          </section>
        </div>

        <section className="surface p-6">
          <h2 className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
            Core Value Propositions
          </h2>
          <ol className="mt-3 space-y-2.5 text-sm">
            {dossier.valueProps.map((prop, index) => (
              <li key={prop} className="flex gap-2.5">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[11px] font-semibold text-accent-deep">
                  {index + 1}
                </span>
                {prop}
              </li>
            ))}
          </ol>
        </section>
      </div>
    );
  }

  // stage === "saved"
  return (
    <div className="relative flex w-full max-w-md flex-col items-center gap-3 py-10 text-center">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <Sparkles className="absolute top-2 left-8 size-5 text-accent/40" />
        <Sparkles className="absolute right-10 bottom-4 size-4 text-accent/30" />
        <Sparkles className="absolute top-16 right-16 size-3 text-accent/50" />
      </div>
      <span className="flex size-20 items-center justify-center rounded-full bg-accent-soft text-accent-deep">
        <CircleCheck className="size-10" aria-hidden />
      </span>
      <p className="text-lg font-semibold">{productName} is in your library</p>
      <p className="max-w-xs text-sm text-ink-muted">
        Head to Products whenever you're ready to turn it into a campaign.
      </p>
    </div>
  );
}
