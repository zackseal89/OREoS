export type Platform = "instagram" | "facebook" | "tiktok" | "linkedin";

export type PostStatus = "scheduled" | "pending-review" | "published";

export type CampaignStatus = "active" | "draft" | "completed" | "paused" | "archived";

export type TrendDirection = "up" | "down" | "flat";

export type Tone = "green" | "blue" | "violet" | "amber" | "pink" | "teal" | "neutral";

export interface KpiStat {
  id: string;
  label: string;
  value: string;
  trendLabel: string;
  trend: TrendDirection;
  tone: Tone;
}

export interface ScheduledPost {
  id: string;
  title: string;
  platform: Platform;
  format: string;
  dayLabel: string;
  dateLabel: string;
  timeLabel: string;
  status: PostStatus;
  thumbnailUrl: string;
}

export type NotificationKind = "success" | "warning" | "ai" | "info";

export interface NotificationItem {
  id: string;
  kind: NotificationKind;
  message: string;
  timeAgo: string;
}

/** Compact campaign shape used on the Dashboard. */
export interface CampaignSummary {
  id: string;
  name: string;
  status: CampaignStatus;
  platforms: Platform[];
  assetCount: number;
  scheduleLabel: string;
  coverUrl: string;
}

/** Full campaign shape used on the Campaigns page. */
export interface Campaign {
  id: string;
  name: string;
  description: string;
  status: CampaignStatus;
  platforms: Platform[];
  brand: string;
  product: string;
  tags: string[];
  owner: string;
  dateRangeLabel: string;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
  assets: number;
  scheduled: number;
  published: number;
  reachK: number;
  engagementPct: number;
  coverUrl: string;
}

export interface QuickActionItem {
  id: string;
  title: string;
  subtitle: string;
}

export interface InsightItem {
  id: string;
  tone: Tone;
  message: string;
  detail: string;
}

export interface NavItem {
  id: string;
  label: string;
}

/** Filter-drawer state for the Campaigns page. */
export interface CampaignFilters {
  statuses: CampaignStatus[];
  platforms: Platform[];
  product: string; // "all" or a product name
  owner: string; // "all" or an owner name
  hasScheduled: "any" | "yes" | "no";
  from: string; // yyyy-mm-dd or ""
  to: string; // yyyy-mm-dd or ""
}

export type CampaignSortKey =
  | "recent"
  | "newest"
  | "oldest"
  | "reach"
  | "engagement"
  | "assets"
  | "alpha";

export type ProductSourceType = "url" | "upload";

export type ProductStatus = "processing" | "ready" | "needs-review";

/** The 4 stages of the product-intake onboarding wizard. */
export type IntakeStage = "input" | "extracting" | "review" | "saved";

/** AI-extracted brand attributes for a single product. */
export interface ProductDossier {
  colors: string[]; // hex values, in display order
  typographyHeadline: string;
  typographyBody: string;
  aestheticTag: string;
  valueProps: string[];
  voiceSummary: string;
  assetUrls: string[];
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  coverUrl: string;
  sourceType: ProductSourceType;
  sourceUrl?: string;
  status: ProductStatus;
  dossier?: ProductDossier;
  linkedCampaigns: number;
  createdAt: string;
  updatedAt: string;
}

export type TeamRole = "owner" | "editor" | "viewer";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  initials: string;
  invited?: boolean;
}

/** Matches PostProxy's profile status values (GET /profiles). */
export type AccountStatus = "active" | "expired" | "inactive";

export interface ConnectedAccount {
  id: string;
  platform: Platform;
  name: string;
  status: AccountStatus;
  avatarUrl?: string;
}

export interface NotificationPref {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

/** The master identity that a workspace's products and campaigns stay consistent with. */
export interface Brand {
  id: string;
  name: string;
  logoUrl: string;
  industry: string;
  colors: string[]; // master hex palette, in display order
  typographyHeadline: string;
  voiceSummary: string;
  createdAt: string;
  updatedAt: string;
}

export type AssetType = "image" | "video" | "carousel" | "story";

/** Lifecycle: draft → pending-review → approved → scheduled → published. */
export type AssetStatus = "draft" | "pending-review" | "approved" | "scheduled" | "published";

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  status: AssetStatus;
  campaignId: string;
  campaignName: string;
  product: string;
  platform: Platform;
  thumbnailUrl: string;
  sizeLabel: string; // e.g. "1080×1350"
  durationSec?: number; // videos only
  createdAt: string; // ISO date
  tags: string[];
  /** AI-generated post copy — present on pipeline-generated assets. */
  copyCaption?: string;
  copyHashtags?: string[];
  performanceScore?: number; // 0–100, model self-assessment
  brandFitScore?: number; // 0–100
  strategicRationale?: string;
  /** PostProxy's id for this post, once publish-asset has sent it. */
  postproxyPostId?: string;
  /** Last publish attempt's error message, if any (cleared on success). */
  publishError?: string;
}

/** Lifecycle: proposed → approved | rejected (HITL gate before generation). */
export type IdeaStatus = "proposed" | "approved" | "rejected";

/** An AI-pitched content idea awaiting human judgement. */
export interface CampaignIdea {
  id: string;
  campaignId: string;
  title: string;
  description: string;
  format: AssetType;
  platforms: Platform[];
  status: IdeaStatus;
  strategicRationale: string;
  creativeDirection: string;
  contentPillar: string;
  createdAt: string;
}

export type GenerationJobStatus = "queued" | "running" | "succeeded" | "failed";

/** Progress row for the asset-generation pipeline. */
export interface GenerationJob {
  id: string;
  ideaId: string;
  campaignId: string;
  status: GenerationJobStatus;
  error?: string;
}

