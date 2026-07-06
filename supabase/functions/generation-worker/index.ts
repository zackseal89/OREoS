// generation-worker — Sprint B4. Invoked by pg_cron (via pg_net, service-role
// bearer token) with one queue message at a time. Not browser-facing.
import { json } from "../_shared/http.ts";
import { serviceClient } from "../_shared/clients.ts";
// import { gemini, MODELS } from "../_shared/gemini.ts";

interface JobMessage {
  jobId?: string;
  workspaceId?: string;
  campaignId?: string;
  ideaId?: string;
  format?: string;
}
interface Payload {
  msg_id?: number;
  message?: JobMessage;
}

Deno.serve(async (req) => {
  let payload: Payload;
  try {
    payload = (await req.json()) as Payload;
  } catch {
    return json({ error: "invalid JSON body" }, 400);
  }

  const { message } = payload;
  if (!message?.jobId) return json({ error: "message.jobId is required" }, 400);

  const svc = serviceClient();
  try {
    await svc.from("generation_jobs").update({ status: "running" }).eq("id", message.jobId);

    // TODO(B4): the core generation step —
    //   1. Load the idea + product dossier + brand palette.
    //   2. Generate the image with MODELS.image (Nano Banana 2, Interactions API,
    //      product/brand reference images attached).
    //   3. Generate copy with MODELS.text (copySchema).
    //   4. Upload the PNG to the 'generated' bucket at {workspaceId}/{assetId}.png.
    //   5. Insert the asset row (status 'pending-review').
    //   6. Increment workspaces.credits_used.

    await svc
      .from("generation_jobs")
      .update({ status: "succeeded", finished_at: new Date().toISOString() })
      .eq("id", message.jobId);

    // TODO(B4): ack the queue with a pgmq.delete(msg_id) RPC so a succeeded job
    // is not re-read after its visibility timeout.
    return json({ ok: true });
  } catch (err) {
    console.error("generation-worker failed", err);
    // Leaving the pgmq message un-acked lets the visibility timeout requeue it;
    // after 3 attempts (enforced by the CHECK on generation_jobs.attempts and
    // B4 retry logic) the job is marked failed.
    await svc
      .from("generation_jobs")
      .update({ status: "failed", error: String(err).slice(0, 500), finished_at: new Date().toISOString() })
      .eq("id", message.jobId);
    return json({ error: String(err) }, 500);
  }
});
