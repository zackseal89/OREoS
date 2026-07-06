import { Check } from "lucide-react";
import { cn } from "../../lib/cn";
import type { IntakeStage } from "../../types";

const STEPS: Array<{ id: IntakeStage; label: string }> = [
  { id: "input", label: "Add Product" },
  { id: "extracting", label: "Extraction" },
  { id: "review", label: "Review Dossier" },
  { id: "saved", label: "Save" },
];

export function OnboardingStepper({ stage }: { stage: IntakeStage }) {
  const currentIndex = STEPS.findIndex((step) => step.id === stage);

  return (
    <ol aria-label="Onboarding progress" className="flex flex-col">
      {STEPS.map((step, index) => {
        const isDone = index < currentIndex;
        const isActive = index === currentIndex;
        const isLast = index === STEPS.length - 1;

        return (
          <li key={step.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  isDone && "bg-accent text-white",
                  isActive && "bg-accent-soft text-accent-deep ring-2 ring-accent",
                  !isDone && !isActive && "bg-neutral-100 text-ink-muted",
                )}
              >
                {isDone ? <Check className="size-3.5" aria-hidden /> : index + 1}
              </span>
              {!isLast && (
                <span
                  aria-hidden
                  className={cn("min-h-6 w-px flex-1", isDone ? "bg-accent" : "bg-line")}
                />
              )}
            </div>
            <span
              aria-current={isActive ? "step" : undefined}
              className={cn(
                "pb-6 text-sm font-medium transition-colors",
                isActive ? "text-ink" : isDone ? "text-ink-secondary" : "text-ink-muted",
              )}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
