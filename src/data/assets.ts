import { campaigns } from "./campaigns";
import type { Asset, AssetStatus, AssetType, Campaign, Platform } from "../types";

/**
 * The asset library is DERIVED from the campaigns dataset: each campaign
 * contributes exactly `campaign.assets` assets, of which `campaign.published`
 * are published and `campaign.scheduled` are scheduled. This keeps every count
 * on the Dashboard, Campaigns page and Assets Library consistent by
 * construction — the same guarantee Firestore will give us later, when assets
 * become a collection and campaign counts become aggregates over it.
 *
 * Generation is fully deterministic (no randomness) so the UI is stable
 * across reloads.
 */

const unsplash = (id: string, w = 640): string =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;

// The proven-to-load covers already used by campaigns/products.
const IMAGE_POOL = [
  "photo-1511920170033-f8396924c348",
  "photo-1447933601403-0c6688de566e",
  "photo-1521017432531-fbd92d768814",
  "photo-1495474472287-4d71bcdd2085",
  "photo-1442512595331-e89e73853f31",
  "photo-1498804103079-a6351b050096",
  "photo-1509042239860-f550ce710b93",
  "photo-1524350876685-274059332603",
  "photo-1541167760496-1628856ab772",
  "photo-1497935586351-b67a49e012bf",
  "photo-1461023058943-07fcbe16d735",
  "photo-1445116572660-236099ec97a0",
].map((id) => unsplash(id));

// Per 8 assets: 4 images, 2 videos, 1 carousel, 1 story.
const TYPE_CYCLE: AssetType[] = [
  "image",
  "image",
  "video",
  "image",
  "carousel",
  "image",
  "story",
  "video",
];

// Statuses for assets that are neither published nor scheduled.
const REMAINDER_STATUS_CYCLE: AssetStatus[] = [
  "approved",
  "pending-review",
  "approved",
  "draft",
];

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  image: "Image",
  video: "Video",
  carousel: "Carousel",
  story: "Story",
};

function sizeFor(type: AssetType, platform: Platform): string {
  if (type === "story" || platform === "tiktok") return "1080×1920";
  if (platform === "linkedin") return "1200×627";
  if (type === "video" || type === "carousel") return "1080×1080";
  return "1080×1350";
}

function statusFor(index: number, campaign: Campaign): AssetStatus {
  if (index < campaign.published) return "published";
  if (index < campaign.published + campaign.scheduled) return "scheduled";
  const remainderIndex = index - campaign.published - campaign.scheduled;
  return REMAINDER_STATUS_CYCLE[remainderIndex % REMAINDER_STATUS_CYCLE.length] ?? "draft";
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function buildAssets(): Asset[] {
  const result: Asset[] = [];
  campaigns.forEach((campaign, campaignIndex) => {
    for (let i = 0; i < campaign.assets; i++) {
      const type = TYPE_CYCLE[(campaignIndex + i) % TYPE_CYCLE.length] ?? "image";
      const platform =
        campaign.platforms[i % campaign.platforms.length] ?? campaign.platforms[0] ?? "instagram";
      const asset: Asset = {
        id: `${campaign.id}-asset-${i + 1}`,
        name: `${campaign.name} — ${ASSET_TYPE_LABELS[type]} ${String(i + 1).padStart(2, "0")}`,
        type,
        status: statusFor(i, campaign),
        campaignId: campaign.id,
        campaignName: campaign.name,
        product: campaign.product,
        platform,
        thumbnailUrl: IMAGE_POOL[(campaignIndex * 5 + i * 3) % IMAGE_POOL.length] ?? IMAGE_POOL[0]!,
        sizeLabel: sizeFor(type, platform),
        createdAt: addDays(campaign.createdAt, i % 14),
        tags: [...campaign.tags, type],
      };
      if (type === "video") {
        asset.durationSec = 12 + ((campaignIndex * 13 + i * 7) % 49);
      }
      result.push(asset);
    }
  });
  return result;
}

export const assets: Asset[] = buildAssets();

export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
