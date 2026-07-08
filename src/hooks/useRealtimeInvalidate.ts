import { useEffect } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface BroadcastPayload {
  operation: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: Record<string, unknown> | null;
  old_record: Record<string, unknown> | null;
}

/**
 * Subscribes to the private `workspace:{id}` broadcast channel written by
 * `private.broadcast_workspace_change` (see supabase/migrations/0004_pipeline.sql)
 * and calls `onChange` for every insert/update/delete on the given tables.
 * Wired tables today: assets, generation_jobs, notifications, products.
 * campaigns/brands don't broadcast yet — add a trigger before relying on this
 * for them.
 */
export function useRealtimeInvalidate(
  workspaceId: string | null | undefined,
  tables: readonly string[],
  onChange: (table: string, payload: BroadcastPayload) => void,
) {
  useEffect(() => {
    if (!workspaceId) return;

    const channel: RealtimeChannel = supabase
      .channel(`workspace:${workspaceId}`, { config: { private: true } })
      .on("broadcast", { event: "*" }, ({ payload }) => {
        const data = payload as BroadcastPayload;
        if (tables.includes(data.table)) onChange(data.table, data);
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
    // `tables` is expected to be a stable (module-level or useMemo'd) array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, tables, onChange]);
}
