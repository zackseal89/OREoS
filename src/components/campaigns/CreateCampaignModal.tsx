import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Megaphone, Plus, Sparkles, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "../../lib/cn";
import { products } from "../../data/products";
import { brands } from "../../data/brands";
import { PlatformIcon } from "../ui/PlatformIcon";
import type { Platform } from "../../types";

const PLATFORMS: Platform[] = ["instagram", "facebook", "tiktok", "linkedin"];

const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
};

type Step = 1 | 2 | 3;

interface FormState {
  name: string;
  description: string;
  platforms: Platform[];
  brandId: string;
  productId: string;
  aiAssist: boolean;
}

const EMPTY: FormState = {
  name: "",
  description: "",
  platforms: [],
  brandId: "",
  productId: "",
  aiAssist: true,
};

interface CreateCampaignModalProps {
  open: boolean;
  onClose: () => void;
  /** Called with the new campaign name after creation (for toast / navigation). */
  onCreated: (name: string) => void;
  /** Pre-selected product id (e.g. from the Products page "Create Campaign" button). */
  preselectedProductId?: string;
}

function StepDot({ step, current }: { step: Step; current: Step }) {
  const done = current > step;
  const active = current === step;
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "flex size-7 items-center justify-center rounded-full text-xs font-bold transition-colors",
          done
            ? "bg-accent text-white"
            : active
              ? "bg-accent-soft text-accent-deep ring-2 ring-accent"
              : "bg-neutral-100 text-ink-muted",
        )}
      >
        {done ? <Check className="size-3.5" aria-hidden /> : step}
      </span>
      <span className={cn("text-[13px] font-medium", active ? "text-ink" : "text-ink-muted")}>
        {step === 1 ? "Basics" : step === 2 ? "Platforms" : "Product"}
      </span>
    </div>
  );
}

export function CreateCampaignModal({
  open,
  onClose,
  onCreated,
  preselectedProductId,
}: CreateCampaignModalProps) {
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>({
    ...EMPTY,
    productId: preselectedProductId ?? "",
  });
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  const nameRef = useRef<HTMLInputElement>(null);

  // reset when opened
  useEffect(() => {
    if (open) {
      setStep(1);
      setForm({ ...EMPTY, productId: preselectedProductId ?? "" });
      setCreating(false);
      setTimeout(() => nameRef.current?.focus(), 50);
    }
  }, [open, preselectedProductId]);

  // close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const togglePlatform = (p: Platform) => {
    setForm((f) => ({
      ...f,
      platforms: f.platforms.includes(p)
        ? f.platforms.filter((x) => x !== p)
        : [...f.platforms, p],
    }));
  };

  const canNext =
    step === 1
      ? form.name.trim().length > 0
      : step === 2
        ? form.platforms.length > 0
        : true;

  const handleCreate = () => {
    setCreating(true);
    // Simulated async — the real call goes to a Cloud Function in Phase 3.
    setTimeout(() => {
      onCreated(form.name.trim());
      onClose();
      navigate("/campaigns");
    }, 700);
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-campaign-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div className="surface relative z-10 flex w-full max-w-lg flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2
            id="create-campaign-title"
            className="flex items-center gap-2 text-[17px] font-semibold"
          >
            <Megaphone className="size-4.5 text-accent" aria-hidden />
            New Campaign
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-xl p-1.5 text-ink-muted transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-accent"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-4 border-b border-line px-6 py-3">
          <StepDot step={1} current={step} />
          <div className="h-px flex-1 bg-line" />
          <StepDot step={2} current={step} />
          <div className="h-px flex-1 bg-line" />
          <StepDot step={3} current={step} />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Step 1 — Basics */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium" htmlFor="campaign-name">
                  Campaign name <span className="text-danger">*</span>
                </label>
                <input
                  ref={nameRef}
                  id="campaign-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Summer Launch 2025"
                  className="w-full rounded-xl border border-line bg-canvas px-4 py-2.5 text-sm placeholder:text-ink-muted focus:border-accent focus:outline-2 focus:outline-accent/30"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium" htmlFor="campaign-desc">
                  Description{" "}
                  <span className="text-xs font-normal text-ink-muted">(optional)</span>
                </label>
                <textarea
                  id="campaign-desc"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="What is this campaign about?"
                  className="w-full resize-none rounded-xl border border-line bg-canvas px-4 py-2.5 text-sm placeholder:text-ink-muted focus:border-accent focus:outline-2 focus:outline-accent/30"
                />
              </div>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, aiAssist: !f.aiAssist }))}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors",
                  form.aiAssist
                    ? "border-accent bg-accent-soft/50"
                    : "border-line hover:bg-neutral-50",
                )}
              >
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full",
                    form.aiAssist ? "bg-accent text-white" : "bg-neutral-100 text-ink-muted",
                  )}
                >
                  <Sparkles className="size-4" aria-hidden />
                </span>
                <span>
                  <span className="block text-sm font-semibold">AI Assist</span>
                  <span className="block text-xs text-ink-muted">
                    Let OREoS generate copy, assets & a posting schedule for you
                  </span>
                </span>
                <span
                  className={cn(
                    "ml-auto flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    form.aiAssist ? "border-accent bg-accent" : "border-line",
                  )}
                >
                  {form.aiAssist && <Check className="size-3 text-white" aria-hidden />}
                </span>
              </button>
            </div>
          )}

          {/* Step 2 — Platforms */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-ink-muted">
                Select the platforms this campaign will publish to. You can always change this
                later.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {PLATFORMS.map((p) => {
                  const active = form.platforms.includes(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => togglePlatform(p)}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl border p-4 text-left transition-colors",
                        active ? "border-accent bg-accent-soft/50" : "border-line hover:bg-neutral-50",
                      )}
                    >
                      <PlatformIcon platform={p} variant="chip" />
                      <span className="text-sm font-semibold">{PLATFORM_LABELS[p]}</span>
                      <span
                        className={cn(
                          "ml-auto flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                          active ? "border-accent bg-accent" : "border-line",
                        )}
                      >
                        {active && <Check className="size-3 text-white" aria-hidden />}
                      </span>
                    </button>
                  );
                })}
              </div>
              {form.platforms.length === 0 && (
                <p className="text-xs text-danger">Please select at least one platform.</p>
              )}
            </div>
          )}

          {/* Step 3 — Product & Brand */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium" htmlFor="campaign-brand">
                  Brand
                </label>
                <select
                  id="campaign-brand"
                  value={form.brandId}
                  onChange={(e) => setForm((f) => ({ ...f, brandId: e.target.value }))}
                  className="w-full rounded-xl border border-line bg-canvas px-4 py-2.5 text-sm focus:border-accent focus:outline-2 focus:outline-accent/30"
                >
                  <option value="">Select a brand…</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium" htmlFor="campaign-product">
                  Product{" "}
                  <span className="text-xs font-normal text-ink-muted">(optional)</span>
                </label>
                <select
                  id="campaign-product"
                  value={form.productId}
                  onChange={(e) => setForm((f) => ({ ...f, productId: e.target.value }))}
                  className="w-full rounded-xl border border-line bg-canvas px-4 py-2.5 text-sm focus:border-accent focus:outline-2 focus:outline-accent/30"
                >
                  <option value="">No specific product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-ink-muted">
                  OREoS uses the product dossier to generate brand-consistent assets.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-line px-6 py-4">
          <button
            type="button"
            onClick={() => (step === 1 ? onClose() : setStep((s) => (s - 1) as Step))}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-ink-secondary transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-accent"
          >
            {step > 1 && <ArrowLeft className="size-4" aria-hidden />}
            {step === 1 ? "Cancel" : "Back"}
          </button>

          {step < 3 ? (
            <button
              type="button"
              disabled={!canNext}
              onClick={() => setStep((s) => (s + 1) as Step)}
              className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-accent-deep disabled:opacity-50 disabled:hover:scale-100"
            >
              Next
              <ArrowRight className="size-4" aria-hidden />
            </button>
          ) : (
            <button
              type="button"
              disabled={creating}
              onClick={handleCreate}
              className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-accent-deep disabled:opacity-50"
            >
              {creating ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden />
                  Creating…
                </>
              ) : (
                <>
                  <Plus className="size-4" aria-hidden />
                  Create Campaign
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
