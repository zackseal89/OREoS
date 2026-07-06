import type {
  CampaignSummary,
  InsightItem,
  KpiStat,
  NotificationItem,
  QuickActionItem,
  ScheduledPost,
} from "../types";

const unsplash = (id: string, w = 480): string =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;

export const workspace = {
  name: "Kafe iko Coffee",
  role: "Workspace",
  logoUrl: unsplash("photo-1447933601403-0c6688de566e", 96),
};

export const currentUser = {
  name: "Zack Mwangi",
  email: "zack@kafeiko.com",
  initials: "ZM",
};

export const kpiStats: KpiStat[] = [
  { id: "campaigns", label: "Campaigns", value: "12", trendLabel: "2 from last week", trend: "up", tone: "green" },
  { id: "scheduled", label: "Posts Scheduled", value: "48", trendLabel: "12 from last week", trend: "up", tone: "blue" },
  { id: "published", label: "Published Today", value: "6", trendLabel: "2 from yesterday", trend: "up", tone: "violet" },
  { id: "reach", label: "Reach", value: "123K", trendLabel: "18.6% from last week", trend: "up", tone: "amber" },
  { id: "engagement", label: "Engagement", value: "8.9%", trendLabel: "1.3% from last week", trend: "up", tone: "pink" },
  { id: "credits", label: "Credits Remaining", value: "1,420", trendLabel: "Resets on Jun 1, 2025", trend: "flat", tone: "teal" },
];

export const upcomingPosts: ScheduledPost[] = [
  {
    id: "post-1",
    title: "Morning Ritual",
    platform: "instagram",
    format: "Instagram Feed Post",
    dayLabel: "Tomorrow, 08:00 AM",
    dateLabel: "May 21, 2025",
    timeLabel: "08:00 AM",
    status: "scheduled",
    thumbnailUrl: unsplash("photo-1509042239860-f550ce710b93", 160),
  },
  {
    id: "post-2",
    title: "Behind the Roast",
    platform: "tiktok",
    format: "TikTok Video",
    dayLabel: "Today, 06:00 PM",
    dateLabel: "May 20, 2025",
    timeLabel: "06:00 PM",
    status: "scheduled",
    thumbnailUrl: unsplash("photo-1447933601403-0c6688de566e", 160),
  },
  {
    id: "post-3",
    title: "Why Kenyan AA Beans Excel",
    platform: "linkedin",
    format: "LinkedIn Carousel",
    dayLabel: "Fri, May 23, 09:00 AM",
    dateLabel: "May 23, 2025",
    timeLabel: "09:00 AM",
    status: "scheduled",
    thumbnailUrl: unsplash("photo-1498804103079-a6351b050096", 160),
  },
  {
    id: "post-4",
    title: "Fresh Roasted. Pure Taste.",
    platform: "facebook",
    format: "Facebook Feed Post",
    dayLabel: "Sat, May 24, 10:00 AM",
    dateLabel: "May 24, 2025",
    timeLabel: "10:00 AM",
    status: "pending-review",
    thumbnailUrl: unsplash("photo-1495474472287-4d71bcdd2085", 160),
  },
];

export const notifications: NotificationItem[] = [
  {
    id: "notif-1",
    kind: "success",
    message: "Your post “Morning Ritual” was published successfully on Instagram.",
    timeAgo: "2m ago",
  },
  {
    id: "notif-2",
    kind: "warning",
    message: "TikTok account connection will expire in 3 days.",
    timeAgo: "1h ago",
  },
  {
    id: "notif-3",
    kind: "ai",
    message: "New AI recommendation available for your “Coffee Launch” campaign.",
    timeAgo: "3h ago",
  },
  {
    id: "notif-4",
    kind: "info",
    message: "Video export completed for “Behind the Roast”.",
    timeAgo: "5h ago",
  },
];

export const recentCampaigns: CampaignSummary[] = [
  {
    id: "camp-1",
    name: "Coffee Launch",
    status: "active",
    platforms: ["instagram", "tiktok", "facebook"],
    assetCount: 24,
    scheduleLabel: "12 Scheduled",
    coverUrl: unsplash("photo-1511920170033-f8396924c348"),
  },
  {
    id: "camp-2",
    name: "Winter Collection",
    status: "draft",
    platforms: ["instagram", "facebook"],
    assetCount: 18,
    scheduleLabel: "6 Scheduled",
    coverUrl: unsplash("photo-1521017432531-fbd92d768814"),
  },
  {
    id: "camp-3",
    name: "Black Friday Sale",
    status: "completed",
    platforms: ["instagram", "tiktok", "linkedin"],
    assetCount: 32,
    scheduleLabel: "25 Published",
    coverUrl: unsplash("photo-1541167760496-1628856ab772"),
  },
  {
    id: "camp-4",
    name: "Subscription Promo",
    status: "active",
    platforms: ["facebook", "instagram"],
    assetCount: 16,
    scheduleLabel: "8 Scheduled",
    coverUrl: unsplash("photo-1442512595331-e89e73853f31"),
  },
];

export const quickActions: QuickActionItem[] = [
  { id: "qa-campaign", title: "Create New Campaign", subtitle: "Start a new AI campaign" },
  { id: "qa-generate", title: "Generate Content", subtitle: "Generate posts with AI" },
  { id: "qa-url", title: "Upload Product URL", subtitle: "Extract assets from product" },
  { id: "qa-chat", title: "AI Chat", subtitle: "Ask OREoS anything" },
  { id: "qa-calendar", title: "View Calendar", subtitle: "See all scheduled posts" },
];

export const aiInsights: InsightItem[] = [
  {
    id: "insight-platform",
    tone: "pink",
    message: "Best performing platform for you is Instagram",
    detail: "+28% engagement",
  },
  {
    id: "insight-content",
    tone: "blue",
    message: "Your audience engages most with educational content",
    detail: "+35% vs other types",
  },
  {
    id: "insight-time",
    tone: "green",
    message: "Optimal posting time for you is between 6PM – 9PM EAT",
    detail: "Based on last 30 days",
  },
  {
    id: "insight-reels",
    tone: "amber",
    message: "Reels get 2.4× more reach than image posts",
    detail: "Try short-form video",
  },
];
