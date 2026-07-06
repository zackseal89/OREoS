import { AiInsights } from "../components/dashboard/AiInsights";
import { KpiCard } from "../components/dashboard/KpiCard";
import { NotificationsCard } from "../components/dashboard/NotificationsCard";
import { QuickActions } from "../components/dashboard/QuickActions";
import { RecentCampaigns } from "../components/dashboard/RecentCampaigns";
import { UpcomingPosts } from "../components/dashboard/UpcomingPosts";
import { TopNav } from "../components/layout/TopNav";
import {
  aiInsights,
  currentUser,
  kpiStats,
  notifications,
  quickActions,
  recentCampaigns,
  upcomingPosts,
} from "../data/mock";

function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function DashboardPage() {
  const firstName = currentUser.name.split(" ")[0] ?? currentUser.name;
  const greeting = greetingForHour(new Date().getHours());

  return (
    <>
      <TopNav notificationCount={notifications.length} />
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
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {kpiStats.map((stat) => (
          <KpiCard key={stat.id} stat={stat} />
        ))}
      </div>

      {/* Upcoming posts + notifications */}
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <UpcomingPosts posts={upcomingPosts} />
        <NotificationsCard items={notifications} />
      </div>

      {/* Campaigns + quick actions */}
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <RecentCampaigns campaigns={recentCampaigns} />
        <QuickActions actions={quickActions} />
      </div>

          {/* AI insights */}
          <AiInsights insights={aiInsights} />
        </div>
      </main>
    </>
  );
}
