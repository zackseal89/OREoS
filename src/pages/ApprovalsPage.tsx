import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, CircleCheck, Download, RotateCcw, Sparkles } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { queryKeys } from "../lib/queryKeys";
import { downloadFile, safeFilename } from "../lib/download";
import { useAssets, useNotifications } from "../hooks/useData";
import { useRealtimeInvalidate } from "../hooks/useRealtimeInvalidate";
import { useSession } from "../context/SessionContext";
import { TopNav } from "../components/layout/TopNav";
import { PlatformIcon } from "../components/ui/PlatformIcon";
import { useToast } from "../hooks/useToast";
import type { Asset } from "../types";

const REALTIME_TABLES = ["assets", "generation_jobs"] as const;

function ScoreChip({ label, value }: { label: string; value?: number }) {
  if (value === undefined) return null;
  return (
    <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-ink-secondary">
      {label} {value}
    </span>
  );
}

function ReviewCard({
  asset,
  busy,
  onApprove,
  onRequestChanges,
}: {
  asset: Asset;
  busy: boolean;
  onApprove: (asset: Asset) => void;
  onRequestChanges: (asset: Asset) => void;
}) {
  return (
    <article className="surface flex flex-col overflow-hidden sm:flex-row">
      <div className="relative aspect-square w-full shrink-0 bg-neutral-100 sm:w-56">
        <img src={asset.thumbnailUrl} alt="" loading="lazy" className="size-full object-cover" />
        <span className="absolute bottom-2.5 left-2.5 flex items-center gap-1 rounded-full bg-ink/60 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
          <PlatformIcon platform={asset.platform} variant="glyph" className="size-3" />
          {asset.type}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-semibold">{asset.name}</h3>
            <p className="mt-0.5 text-xs text-ink-muted">{asset.campaignName}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <ScoreChip label="Perf" value={asset.performanceScore} />
            <ScoreChip label="Brand fit" value={asset.brandFitScore} />
          </div>
        </div>

        {asset.copyCaption && (
          <p className="line-clamp-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-secondary">
            {asset.copyCaption}
          </p>
        )}
        {asset.copyHashtags && asset.copyHashtags.length > 0 && (
          <p className="line-clamp-1 text-[13px] font-medium text-accent-deep">
            {asset.copyHashtags.join(" ")}
          </p>
        )}
        {asset.strategicRationale && (
          <p className="rounded-xl bg-canvas px-3.5 py-2.5 text-[13px] leading-relaxed text-ink-muted">
            <span className="font-semibold text-ink-secondary">Why this works: </span>
            {asset.strategicRationale}
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            disabled={busy}
            onClick={() => onApprove(asset)}
            className="flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-[13px] font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            <Check className="size-3.5" aria-hidden />
            Approve
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onRequestChanges(asset)}
            className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-medium text-ink-muted transition-colors hover:bg-neutral-100 hover:text-ink disabled:opacity-50"
          >
            <RotateCcw className="size-3.5" aria-hidden />
            Send back to draft
          </button>
        </div>
      </div>
    </article>
  );
}

export function ApprovalsPage() {
  const navigate = useNavigate();
  const { toast, showToast } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { activeWorkspace } = useSession();
  const { data: notifications = [] } = useNotifications();
  const { data: allAssets = [], isLoading } = useAssets();

  const onRealtimeChange = useCallback(() => {
    if (!activeWorkspace) return;
    void queryClient.invalidateQueries({ queryKey: queryKeys.assets(activeWorkspace.id) });
  }, [activeWorkspace, queryClient]);
  useRealtimeInvalidate(activeWorkspace?.id, REALTIME_TABLES, onRealtimeChange);

  const pending = useMemo(
    () => allAssets.filter((a) => a.status === "pending-review"),
    [allAssets],
  );
  const recentlyApproved = useMemo(
    () => allAssets.filter((a) => a.status === "approved").slice(0, 6),
    [allAssets],
  );

  const transition = async (asset: Asset, status: "approved" | "draft", doneMsg: string) => {
    setBusyId(asset.id);
    const { error } = await supabase.from("assets").update({ status }).eq("id", asset.id);
    setBusyId(null);
    if (error) {
      showToast(`Couldn't update "${asset.name}": ${error.message}`);
      return;
    }
    if (activeWorkspace) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.assets(activeWorkspace.id) });
    }
    showToast(doneMsg);
  };

  return (
    <>
      <TopNav notificationCount={notifications.length} />
      <main className="flex-1">
        <div className="mx-auto max-w-[1100px] px-8 pb-16 pt-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight">Approvals</h1>
            <p className="mt-1 text-sm text-ink-muted">
              Every AI-generated asset waits here for your judgement. Only approved assets can be
              downloaded or scheduled.
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="size-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            </div>
          ) : pending.length === 0 ? (
            <div className="surface flex flex-col items-center p-12 text-center">
              <span className="flex size-16 items-center justify-center rounded-full bg-accent-soft text-accent-deep">
                <CircleCheck className="size-8" aria-hidden />
              </span>
              <h2 className="mt-5 text-xl font-semibold">All clear — nothing awaiting review</h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-muted">
                When OREoS generates assets for an approved idea, they land here as
                “pending review” so a human always signs off before anything ships.
              </p>
              <button
                type="button"
                onClick={() => navigate("/campaigns")}
                className="mt-6 flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
              >
                <Sparkles className="size-4" aria-hidden />
                Go generate something
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm font-medium text-ink-secondary">
                {pending.length} asset{pending.length === 1 ? "" : "s"} awaiting review
              </p>
              {pending.map((asset) => (
                <ReviewCard
                  key={asset.id}
                  asset={asset}
                  busy={busyId === asset.id}
                  onApprove={(a) => void transition(a, "approved", `"${a.name}" approved — ready to download and schedule.`)}
                  onRequestChanges={(a) => void transition(a, "draft", `"${a.name}" sent back to draft.`)}
                />
              ))}
            </div>
          )}

          {recentlyApproved.length > 0 && (
            <div className="mt-10">
              <h2 className="mb-3 text-[15px] font-semibold text-ink-secondary">
                Recently approved
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {recentlyApproved.map((a) => (
                  <div key={a.id} className="surface group relative overflow-hidden">
                    <div className="aspect-square bg-neutral-100">
                      <img src={a.thumbnailUrl} alt={a.name} loading="lazy" className="size-full object-cover" />
                    </div>
                    <button
                      type="button"
                      aria-label={`Download ${a.name}`}
                      onClick={() => {
                        void downloadFile(a.thumbnailUrl, safeFilename(a.name));
                        showToast(`Downloading "${a.name}"…`);
                      }}
                      className="absolute inset-0 flex items-center justify-center bg-ink/35 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                    >
                      <span className="flex size-9 items-center justify-center rounded-full bg-card text-ink-secondary shadow-lift">
                        <Download className="size-4" aria-hidden />
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {toast && (
          <output className="surface fixed right-6 bottom-6 z-50 block px-4 py-3 text-sm font-medium shadow-lift">
            {toast}
          </output>
        )}
      </main>
    </>
  );
}
