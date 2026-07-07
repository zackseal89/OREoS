import { useEffect, useState } from "react";
import { AiInsights } from "../components/dashboard/AiInsights";
import { KpiCard } from "../components/dashboard/KpiCard";
import { NotificationsCard } from "../components/dashboard/NotificationsCard";
import { QuickActions } from "../components/dashboard/QuickActions";
import { RecentCampaigns } from "../components/dashboard/RecentCampaigns";
import { UpcomingPosts } from "../components/dashboard/UpcomingPosts";
import { TopNav } from "../components/layout/TopNav";
import { useSession } from "../context/SessionContext";
import { supabase } from "../lib/supabase";
import type { CampaignSummary, KpiStat, NotificationItem, ScheduledPost } from "../types";

const quickActions = [
  { id: "qa-campaign", title: "Create New Campaign", subtitle: "Start a new AI campaign" },
  { id: "qa-generate", title: "Generate Content", subtitle: "Generate posts with AI" },
  { id: "qa-url", title: "Upload Product URL", subtitle: "Extract assets from product" },
  { id: "qa-chat", title: "AI Chat", subtitle: "Ask OREoS anything" },
  { id: "qa-calendar", title: "View Calendar", subtitle: "See all scheduled posts" },
];

const aiInsights = [
  {
    id: "insight-platform",
    tone: "pink" as const,
    message: "Best performing platform for you is Instagram",
    detail: "+28% engagement",
  },
  {
    id: "insight-content",
    tone: "blue" as const,
    message: "Your audience engages most with educational content",
    detail: "+35% vs other types",
  },
  {
    id: "insight-time",
    tone: "green" as const,
    message: "Optimal posting time for you is between 6PM – 9PM EAT",
    detail: "Based on last 30 days",
  },
  {
    id: "insight-reels",
    tone: "amber" as const,
    message: "Reels get 2.4× more reach than image posts",
    detail: "Try short-form video",
  },
];

function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function DashboardPage() {
  const { activeWorkspace, profile, session } = useSession();
  const [stats, setStats] = useState<{
    campaigns: number;
    assets: number;
    scheduled_posts: number;
    pending_review: number;
  } | null>(null);

  const [upcoming, setUpcoming] = useState<ScheduledPost[]>([]);
  const [notificationsList, setNotificationsList] = useState<NotificationItem[]>([]);
  const [campaignsList, setCampaignsList] = useState<CampaignSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeWorkspace) return;

    let active = true;
    setLoading(true);

    async function loadDashboardData() {
      try {
        const [statsRes, postsRes, notifsRes, campsRes] = await Promise.all([
          supabase
            .from("workspace_stats")
            .select("*")
            .eq("workspace_id", activeWorkspace.id)
            .maybeSingle(),
          supabase
            .from("assets")
            .select("*")
            .eq("workspace_id", activeWorkspace.id)
            .in("status", ["scheduled", "pending-review"])
            .order("scheduled_at", { ascending: true, nullsFirst: false })
            .limit(5),
          supabase
            .from("notifications")
            .select("*")
            .eq("workspace_id", activeWorkspace.id)
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("campaigns")
            .select("*, campaign_stats(*)")
            .eq("workspace_id", activeWorkspace.id)
            .neq("status", "archived")
            .order("updated_at", { ascending: false })
            .limit(4),
        ]);

        if (!active) return;

        if (statsRes.data) {
          setStats(statsRes.data as any);
        }

        if (postsRes.data) {
          const mappedPosts: ScheduledPost[] = postsRes.data.map((post: any) => {
            const scheduledDate = post.scheduled_at ? new Date(post.scheduled_at) : new Date();
            return {
              id: post.id,
              title: post.name,
              platform: post.platform,
              format: post.type === "story" ? "Story" : `${post.platform.charAt(0).toUpperCase() + post.platform.slice(1)} ${post.type.charAt(0).toUpperCase() + post.type.slice(1)}`,
              dayLabel: post.scheduled_at ? scheduledDate.toLocaleString("en-US", { weekday: "short", hour: "2-digit", minute: "2-digit" }) : "Unscheduled",
              dateLabel: scheduledDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
              timeLabel: scheduledDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
              status: post.status === "pending-review" ? "pending-review" : "scheduled",
              thumbnailUrl: post.storage_path
                ? supabase.storage.from("generated").getPublicUrl(post.storage_path).data.publicUrl
                : "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=160&q=70",
            };
          });
          setUpcoming(mappedPosts);
        }

        if (notifsRes.data) {
          const mappedNotifs: NotificationItem[] = notifsRes.data.map((notif: any) => {
            const diffMs = Date.now() - new Date(notif.created_at).getTime();
            const diffMin = Math.floor(diffMs / 60000);
            let timeAgo = "Just now";
            if (diffMin > 0) {
              if (diffMin < 60) timeAgo = `${diffMin}m ago`;
              else if (diffMin < 1440) timeAgo = `${Math.floor(diffMin / 60)}h ago`;
              else timeAgo = `${Math.floor(diffMin / 1440)}d ago`;
            }
            return {
              id: notif.id,
              kind: notif.kind,
              message: notif.message,
              timeAgo,
            };
          });
          setNotificationsList(mappedNotifs);
        }

        if (campsRes.data) {
          const mappedCamps: CampaignSummary[] = campsRes.data.map((camp: any) => {
            const statsObj = camp.campaign_stats?.[0] || { assets: 0, scheduled: 0, published: 0 };
            return {
              id: camp.id,
              name: camp.name,
              status: camp.status,
              platforms: camp.platforms,
              assetCount: statsObj.assets,
              scheduleLabel: `${statsObj.scheduled} Scheduled`,
              coverUrl: "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=480&q=70",
            };
          });
          setCampaignsList(mappedCamps);
        }
      } catch (err) {
        console.error("Error loading dashboard data", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboardData();
    return () => {
      active = false;
    };
  }, [activeWorkspace]);

  const displayName = profile?.name ?? session?.user.email ?? "there";
  const firstName = displayName.split(/[\s@]/)[0] ?? displayName;
  const greeting = greetingForHour(new Date().getHours());

  const campaignsCount = stats?.campaigns ?? 0;
  const scheduledCount = stats?.scheduled_posts ?? 0;
  const pendingCount = stats?.pending_review ?? 0;
  const totalAssetsCount = stats?.assets ?? 0;
  const publishedCount = totalAssetsCount - scheduledCount - pendingCount;
  
  const creditsRemaining = activeWorkspace ? activeWorkspace.credits_total - activeWorkspace.credits_used : 0;

  const kpis: KpiStat[] = [
    { id: "campaigns", label: "Campaigns", value: String(campaignsCount), trendLabel: "Active campaigns", trend: "flat", tone: "green" },
    { id: "scheduled", label: "Posts Scheduled", value: String(scheduledCount), trendLabel: "Awaiting publish", trend: "flat", tone: "blue" },
    { id: "published", label: "Published Assets", value: String(publishedCount >= 0 ? publishedCount : 0), trendLabel: "Completed posts", trend: "flat", tone: "violet" },
    { id: "pending", label: "Pending Review", value: String(pendingCount), trendLabel: "Needs approval", trend: "flat", tone: "amber" },
    { id: "credits", label: "Credits Remaining", value: creditsRemaining.toLocaleString(), trendLabel: "Resets monthly", trend: "flat", tone: "teal" },
  ];

  if (loading) {
    return (
      <>
        <TopNav notificationCount={0} />
        <main className="flex-1 flex items-center justify-center min-h-[300px]">
          <div className="size-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </main>
      </>
    );
  }

  return (
    <>
      <TopNav notificationCount={notificationsList.length} />
      <main className="flex-1">
        <div className="mx-auto max-w-[1440px] space-y-6 px-8 py-8">
          {/* Hero greeting */}
          <div>
            <h1 className="text-[32px] font-bold tracking-tight">
              {greeting}, {firstName} <span aria-hidden>👋</span>
            </h1>
            <p className="mt-1 text-[15px] text-ink-muted">
              Here's what's happening with your content today.
            </p>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
            {kpis.map((stat) => (
              <KpiCard key={stat.id} stat={stat} />
            ))}
          </div>

          {/* Upcoming posts + notifications */}
          <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <UpcomingPosts posts={upcoming} />
            <NotificationsCard items={notificationsList} />
          </div>

          {/* Campaigns + quick actions */}
          <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <RecentCampaigns campaigns={campaignsList} />
            <QuickActions actions={quickActions} />
          </div>

          {/* AI insights */}
          <AiInsights insights={aiInsights} />
        </div>
      </main>
    </>
  );
}

