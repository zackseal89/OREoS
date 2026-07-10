/**
 * Live workspace data, sourced from Supabase (no mock). Every hook is scoped by
 * the active workspace and returns the app's UI types, mapping DB rows across.
 * Fields with no backend yet (reach, engagement) are surfaced as 0 rather than
 * fabricated; images with no stored file fall back to a neutral gradient.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { coverFor } from "../lib/cover";
import { queryKeys } from "../lib/queryKeys";
import { useSession } from "../context/SessionContext";
import type {
  Asset,
  Brand,
  Campaign,
  CampaignIdea,
  ConnectedAccount,
  GenerationJob,
  NotificationItem,
  Product,
  ProductDossier,
} from "../types";

const day = (iso: string | null): string => (iso ? iso.slice(0, 10) : "");

export function timeAgo(iso: string): string {
  const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin <= 0) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`;
  return `${Math.floor(diffMin / 1440)}d ago`;
}

function mapDossier(raw: unknown): ProductDossier | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const d = raw as Record<string, unknown>;
  const arr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x) => typeof x === "string") : []);
  const str = (v: unknown): string => (typeof v === "string" ? v : "");
  return {
    colors: arr(d.colors),
    typographyHeadline: str(d.typographyHeadline),
    typographyBody: str(d.typographyBody),
    aestheticTag: str(d.aestheticTag),
    valueProps: arr(d.valueProps),
    voiceSummary: str(d.voiceSummary),
    assetUrls: arr(d.assetUrls),
  };
}

// ── Products ────────────────────────────────────────────────────────────────
function mapProduct(row: any): Product {
  const dossier = mapDossier(row.dossier);
  return {
    id: row.id,
    name: row.name,
    brand: row.brands?.name ?? "—",
    category: row.category ?? "Uncategorized",
    coverUrl: dossier?.assetUrls[0] ?? coverFor(row.id),
    sourceType: row.source_type,
    sourceUrl: row.source_url ?? undefined,
    status: row.status,
    dossier,
    linkedCampaigns: row.campaigns?.[0]?.count ?? 0,
    createdAt: day(row.created_at),
    updatedAt: day(row.updated_at),
  };
}

export function useProducts() {
  const { activeWorkspace } = useSession();
  const wsId = activeWorkspace?.id;
  return useQuery({
    queryKey: queryKeys.products(wsId ?? "none"),
    enabled: !!wsId,
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("*, brands(name), campaigns(count)")
        .eq("workspace_id", wsId!)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapProduct);
    },
  });
}

export function useProduct(productId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.product(productId ?? "none"),
    enabled: !!productId,
    queryFn: async (): Promise<Product | null> => {
      const { data, error } = await supabase
        .from("products")
        .select("*, brands(name), campaigns(count)")
        .eq("id", productId!)
        .maybeSingle();
      if (error) throw error;
      return data ? mapProduct(data) : null;
    },
  });
}

// ── Campaigns ─────────────────────────────────────────────────────────────---
function mapCampaign(row: any, stats: Map<string, any>, owners: Map<string, string>): Campaign {
  const s = stats.get(row.id) ?? {};
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    status: row.status,
    platforms: row.platforms ?? [],
    brand: row.brands?.name ?? "—",
    product: row.products?.name ?? "—",
    tags: row.tags ?? [],
    owner: owners.get(row.owner_id) ?? "—",
    dateRangeLabel: dateRange(row.start_at, row.end_at),
    createdAt: day(row.created_at),
    updatedAt: day(row.updated_at),
    assets: s.assets ?? 0,
    scheduled: s.scheduled ?? 0,
    published: s.published ?? 0,
    reachK: 0,
    engagementPct: 0,
    coverUrl: coverFor(row.id),
  };
}

function dateRange(start: string | null, end: string | null): string {
  if (!start && !end) return "No dates set";
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  return fmt((start ?? end)!);
}

export function useCampaigns() {
  const { activeWorkspace } = useSession();
  const wsId = activeWorkspace?.id;
  return useQuery({
    queryKey: queryKeys.campaigns(wsId ?? "none"),
    enabled: !!wsId,
    queryFn: async (): Promise<Campaign[]> => {
      const [campsRes, statsRes, membersRes] = await Promise.all([
        supabase
          .from("campaigns")
          .select("*, brands(name), products(name)")
          .eq("workspace_id", wsId!)
          .order("updated_at", { ascending: false }),
        supabase.from("campaign_stats").select("*").eq("workspace_id", wsId!),
        supabase.rpc("list_workspace_members", { ws: wsId! }),
      ]);
      if (campsRes.error) throw campsRes.error;
      const stats = new Map<string, any>((statsRes.data ?? []).map((r: any) => [r.campaign_id, r]));
      const owners = new Map<string, string>(
        (membersRes.data ?? []).map((m: any) => [m.id ?? m.user_id, m.name]),
      );
      return (campsRes.data ?? []).map((row) => mapCampaign(row, stats, owners));
    },
  });
}

export function useCampaign(campaignId: string | undefined) {
  const { activeWorkspace } = useSession();
  const wsId = activeWorkspace?.id;
  return useQuery({
    queryKey: queryKeys.campaign(campaignId ?? "none"),
    enabled: !!campaignId,
    queryFn: async (): Promise<Campaign | null> => {
      const [campRes, statsRes, membersRes] = await Promise.all([
        supabase
          .from("campaigns")
          .select("*, brands(name), products(name)")
          .eq("id", campaignId!)
          .maybeSingle(),
        supabase.from("campaign_stats").select("*").eq("campaign_id", campaignId!),
        wsId
          ? supabase.rpc("list_workspace_members", { ws: wsId })
          : Promise.resolve({ data: [] as any[] }),
      ]);
      if (campRes.error) throw campRes.error;
      if (!campRes.data) return null;
      const stats = new Map<string, any>((statsRes.data ?? []).map((r: any) => [r.campaign_id, r]));
      const owners = new Map<string, string>(
        ((membersRes as any).data ?? []).map((m: any) => [m.id ?? m.user_id, m.name]),
      );
      return mapCampaign(campRes.data, stats, owners);
    },
  });
}

// ── Assets ────────────────────────────────────────────────────────────────---
function mapAsset(row: any): Asset {
  const publicUrl = row.storage_path
    ? supabase.storage.from("generated").getPublicUrl(row.storage_path).data.publicUrl
    : coverFor(row.id);
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    status: row.status,
    campaignId: row.campaign_id,
    campaignName: row.campaigns?.name ?? "—",
    product: row.campaigns?.products?.name ?? "—",
    platform: row.platform,
    thumbnailUrl: publicUrl,
    sizeLabel: row.size_label ?? "",
    durationSec: row.duration_sec ?? undefined,
    createdAt: day(row.created_at),
    tags: row.tags ?? [],
    copyCaption: row.copy_caption ?? undefined,
    copyHashtags: row.copy_hashtags ?? undefined,
    performanceScore: row.performance_score ?? undefined,
    brandFitScore: row.brand_fit_score ?? undefined,
    strategicRationale: row.strategic_rationale ?? undefined,
    postproxyPostId: row.postproxy_post_id ?? undefined,
    publishError: row.publish_error ?? undefined,
  };
}

export function useAssets() {
  const { activeWorkspace } = useSession();
  const wsId = activeWorkspace?.id;
  return useQuery({
    queryKey: queryKeys.assets(wsId ?? "none"),
    enabled: !!wsId,
    queryFn: async (): Promise<Asset[]> => {
      const { data, error } = await supabase
        .from("assets")
        .select("*, campaigns(name, products(name))")
        .eq("workspace_id", wsId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapAsset);
    },
  });
}

// ── Campaign ideas (HITL gate) ──────────────────────────────────────────────
function mapIdea(row: any): CampaignIdea {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    title: row.title,
    description: row.description,
    format: row.format,
    platforms: row.platforms ?? [],
    status: row.status,
    strategicRationale: row.strategic_rationale ?? row.rationale ?? "",
    creativeDirection: row.creative_direction ?? "",
    contentPillar: row.content_pillar ?? "",
    createdAt: day(row.created_at),
  };
}

export function useCampaignIdeas(campaignId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.campaignIdeas(campaignId ?? "none"),
    enabled: !!campaignId,
    queryFn: async (): Promise<CampaignIdea[]> => {
      const { data, error } = await supabase
        .from("campaign_ideas")
        .select("*")
        .eq("campaign_id", campaignId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map(mapIdea);
    },
  });
}

export function useGenerationJobs(campaignId: string | undefined) {
  return useQuery({
    queryKey: ["generationJobsByCampaign", campaignId ?? "none"] as const,
    enabled: !!campaignId,
    // Poll while any job is in flight — resilient even if realtime drops.
    refetchInterval: (query) =>
      (query.state.data ?? []).some((j) => j.status === "queued" || j.status === "running")
        ? 4000
        : false,
    queryFn: async (): Promise<GenerationJob[]> => {
      const { data, error } = await supabase
        .from("generation_jobs")
        .select("id, idea_id, campaign_id, status, error")
        .eq("campaign_id", campaignId!);
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        id: r.id,
        ideaId: r.idea_id,
        campaignId: r.campaign_id,
        status: r.status,
        error: r.error ?? undefined,
      }));
    },
  });
}

// ── Brands ────────────────────────────────────────────────────────────────---
function mapBrand(row: any): Brand {
  return {
    id: row.id,
    name: row.name,
    logoUrl: row.logo_url ?? coverFor(row.id),
    industry: row.industry ?? "",
    colors: row.colors ?? [],
    typographyHeadline: row.typography_headline ?? "",
    voiceSummary: row.voice_summary ?? "",
    createdAt: day(row.created_at),
    updatedAt: day(row.updated_at),
  };
}

export function useBrands() {
  const { activeWorkspace } = useSession();
  const wsId = activeWorkspace?.id;
  return useQuery({
    queryKey: queryKeys.brands(wsId ?? "none"),
    enabled: !!wsId,
    queryFn: async (): Promise<Brand[]> => {
      const { data, error } = await supabase
        .from("brands")
        .select("*")
        .eq("workspace_id", wsId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapBrand);
    },
  });
}

// ── Connected accounts (PostProxy) ──────────────────────────────────────────
export function useConnectedAccounts() {
  const { activeWorkspace } = useSession();
  const wsId = activeWorkspace?.id;
  return useQuery({
    queryKey: ["connectedAccounts", wsId ?? "none"] as const,
    enabled: !!wsId,
    queryFn: async (): Promise<ConnectedAccount[]> => {
      const { data, error } = await supabase.functions.invoke("list-accounts", {
        body: { workspaceId: wsId },
      });
      if (error) throw error;
      return (data?.accounts ?? []) as ConnectedAccount[];
    },
  });
}

// ── Notifications ─────────────────────────────────────────────────────────---
export function useNotifications() {
  const { activeWorkspace } = useSession();
  const wsId = activeWorkspace?.id;
  return useQuery({
    queryKey: queryKeys.notifications(wsId ?? "none"),
    enabled: !!wsId,
    queryFn: async (): Promise<NotificationItem[]> => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("workspace_id", wsId!)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []).map((n: any) => ({
        id: n.id,
        kind: n.kind,
        message: n.message,
        timeAgo: timeAgo(n.created_at),
      }));
    },
  });
}
