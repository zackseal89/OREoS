import { ArrowRight, ChevronDown, CircleCheck, Play, Sparkles } from "lucide-react";

const NAV_LINKS: Array<{ label: string; dropdown?: boolean }> = [
  { label: "Features", dropdown: true },
  { label: "Use Cases" },
  { label: "Examples" },
  { label: "Pricing" },
  { label: "Resources", dropdown: true },
  { label: "Company", dropdown: true },
];

const TRUST_BADGES = ["No credit card required", "Cancel anytime", "14-day free trial"];

// Rendered at native size then scaled down, so the preview shows crisp, real app UI.
const PREVIEW_WIDTH = 1600;
const PREVIEW_HEIGHT = 1100;
const PREVIEW_SCALE = 0.6;

function MarketingNav() {
  return (
    <header className="flex items-center justify-between border-b border-line px-8 py-4">
      <span className="text-xl font-bold tracking-tight">
        <span className="text-accent">O</span>REoS
      </span>

      <nav aria-label="Marketing navigation" className="hidden items-center gap-7 lg:flex">
        {NAV_LINKS.map(({ label, dropdown }) => (
          <a
            key={label}
            href="#"
            onClick={(event) => event.preventDefault()}
            className="flex items-center gap-1 text-sm font-medium text-ink-secondary transition-colors hover:text-ink"
          >
            {label}
            {dropdown && <ChevronDown className="size-3.5" aria-hidden />}
          </a>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        <a
          href="#"
          onClick={(event) => event.preventDefault()}
          className="rounded-xl border border-line px-4 py-2 text-sm font-semibold transition-colors hover:bg-neutral-100"
        >
          Log in
        </a>
        <a
          href="#"
          onClick={(event) => event.preventDefault()}
          className="flex items-center gap-2 rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          Start Free
          <ArrowRight className="size-4" aria-hidden />
        </a>
      </div>
    </header>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <MarketingNav />

      <section className="relative overflow-hidden px-8 pt-20 pb-24 text-center">
        {/* Decorative background wash */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,var(--color-accent-soft),transparent_60%)]"
        />

        <span className="mx-auto inline-flex items-center gap-2 rounded-full bg-accent-soft px-4 py-1.5 text-xs font-semibold tracking-wide text-accent-deep uppercase">
          <Sparkles className="size-3.5" aria-hidden />
          AI Marketing Operating System
        </span>

        <h1 className="mx-auto mt-6 max-w-4xl text-[56px] leading-[1.05] font-bold tracking-tight">
          Turn any product into a complete <span className="text-accent">marketing campaign</span>
          .
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-ink-muted">
          Paste your product URL and OREoS analyzes your brand, generates campaign strategies,
          creates stunning content, captions, and schedules across all your social platforms. All
          powered by AI.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#"
            onClick={(event) => event.preventDefault()}
            className="flex items-center gap-2 rounded-xl bg-ink px-6 py-3.5 text-[15px] font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Start Free — No Credit Card
            <ArrowRight className="size-4" aria-hidden />
          </a>
          <a
            href="#"
            onClick={(event) => event.preventDefault()}
            className="flex items-center gap-2 rounded-xl border border-line bg-card px-6 py-3.5 text-[15px] font-semibold transition-colors hover:bg-neutral-100"
          >
            Watch Demo
            <Play className="size-4" aria-hidden />
          </a>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-ink-secondary">
          {TRUST_BADGES.map((label) => (
            <span key={label} className="flex items-center gap-1.5">
              <CircleCheck className="size-4 text-accent" aria-hidden />
              {label}
            </span>
          ))}
        </div>

        {/* Live product preview — the real, current app (not a static mockup) */}
        <div className="mx-auto mt-16 w-fit max-w-full overflow-x-auto">
          <div className="surface overflow-hidden rounded-2xl text-left shadow-lift">
            <div className="flex items-center gap-1.5 border-b border-line bg-canvas px-4 py-3">
              <span className="size-2.5 rounded-full bg-red-400" />
              <span className="size-2.5 rounded-full bg-amber-400" />
              <span className="size-2.5 rounded-full bg-accent" />
            </div>
            <div
              className="overflow-hidden bg-canvas"
              style={{
                width: PREVIEW_WIDTH * PREVIEW_SCALE,
                height: PREVIEW_HEIGHT * PREVIEW_SCALE,
              }}
            >
              <iframe
                src="/dashboard"
                title="OREoS dashboard preview"
                tabIndex={-1}
                aria-hidden="true"
                scrolling="no"
                className="pointer-events-none origin-top-left"
                style={{
                  width: PREVIEW_WIDTH,
                  height: PREVIEW_HEIGHT,
                  transform: `scale(${PREVIEW_SCALE})`,
                  border: "none",
                }}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
