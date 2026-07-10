import { Check, Lightbulb, Loader2, Sparkles, X } from "lucide-react";
import { cn } from "../../lib/cn";
import { PlatformIcon } from "../ui/PlatformIcon";
import { ASSET_TYPE_ICONS } from "../assets/AssetCard";
import type { CampaignIdea, GenerationJobStatus } from "../../types";

const JOB_LABELS: Record<GenerationJobStatus, string> = {
  queued: "Queued…",
  running: "Generating…",
  succeeded: "Asset ready",
  failed: "Generation failed",
};

interface IdeaCardProps {
  idea: CampaignIdea;
  /** Status of this idea's generation job, when one exists. */
  jobStatus?: GenerationJobStatus;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  busy: boolean;
}

export function IdeaCard({
  idea,
  jobStatus,
  selected,
  onToggleSelect,
  onApprove,
  onReject,
  busy,
}: IdeaCardProps) {
  const TypeIcon = ASSET_TYPE_ICONS[idea.format];
  const proposed = idea.status === "proposed";
  const rejected = idea.status === "rejected";

  return (
    <article
      className={cn(
        "surface flex flex-col gap-3 p-5 transition-opacity",
        rejected && "opacity-50",
        selected && "ring-2 ring-accent",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {proposed && (
            <input
              type="checkbox"
              checked={selected}
              aria-label={`Select idea "${idea.title}"`}
              onChange={() => onToggleSelect(idea.id)}
              className="mt-1 size-4.5 cursor-pointer rounded accent-accent"
            />
          )}
          <div>
            <h3 className="text-[15px] font-semibold leading-snug">{idea.title}</h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
              <span className="flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 font-medium">
                <TypeIcon className="size-3" aria-hidden />
                {idea.format}
              </span>
              {idea.contentPillar && (
                <span className="flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 font-medium text-accent-deep">
                  <Lightbulb className="size-3" aria-hidden />
                  {idea.contentPillar}
                </span>
              )}
              <span className="flex items-center gap-1">
                {idea.platforms.map((p) => (
                  <PlatformIcon key={p} platform={p} variant="glyph" className="size-3.5" />
                ))}
              </span>
            </div>
          </div>
        </div>

        {/* Status / job chip */}
        {idea.status === "approved" && (
          <span
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
              jobStatus === "failed"
                ? "bg-danger/10 text-danger"
                : jobStatus === "succeeded"
                  ? "bg-accent-soft text-accent-deep"
                  : "bg-neutral-100 text-ink-secondary",
            )}
          >
            {(jobStatus === "queued" || jobStatus === "running") && (
              <Loader2 className="size-3 animate-spin" aria-hidden />
            )}
            {jobStatus === "succeeded" && <Check className="size-3" aria-hidden />}
            {jobStatus ? JOB_LABELS[jobStatus] : "Approved"}
          </span>
        )}
        {rejected && (
          <span className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-ink-muted">
            Rejected
          </span>
        )}
      </div>

      <p className="text-sm leading-relaxed text-ink-secondary">{idea.description}</p>

      {idea.strategicRationale && (
        <p className="rounded-xl bg-canvas px-3.5 py-2.5 text-[13px] leading-relaxed text-ink-muted">
          <span className="font-semibold text-ink-secondary">Why this works: </span>
          {idea.strategicRationale}
        </p>
      )}

      {proposed && (
        <div className="mt-auto flex items-center gap-2 pt-1">
          <button
            type="button"
            disabled={busy}
            onClick={() => onApprove(idea.id)}
            className="flex items-center gap-1.5 rounded-xl bg-accent px-3.5 py-2 text-[13px] font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            <Sparkles className="size-3.5" aria-hidden />
            Approve & Generate
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onReject(idea.id)}
            className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-medium text-ink-muted transition-colors hover:bg-neutral-100 hover:text-ink disabled:opacity-50"
          >
            <X className="size-3.5" aria-hidden />
            Reject
          </button>
        </div>
      )}
    </article>
  );
}
