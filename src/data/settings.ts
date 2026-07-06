import type { ConnectedAccount, NotificationPref, TeamMember } from "../types";

export const teamMembers: TeamMember[] = [
  {
    id: "member-zack",
    name: "Zack Mwangi",
    email: "zack@kafeiko.com",
    role: "owner",
    initials: "ZM",
  },
  {
    id: "member-amina",
    name: "Amina Otieno",
    email: "amina@kafeiko.com",
    role: "editor",
    initials: "AO",
  },
  {
    id: "member-brian",
    name: "Brian Kip",
    email: "brian@kafeiko.com",
    role: "viewer",
    initials: "BK",
  },
];

export const connectedAccounts: ConnectedAccount[] = [
  { platform: "instagram", handle: "@kafeiko", status: "connected" },
  { platform: "facebook", handle: "Kafe iko Coffee", status: "connected" },
  { platform: "tiktok", handle: "@kafeiko.coffee", status: "expiring" },
  { platform: "linkedin", handle: "Not connected", status: "disconnected" },
];

export const notificationPrefs: NotificationPref[] = [
  {
    id: "pref-published",
    label: "Post published",
    description: "When a scheduled post goes live on any platform.",
    enabled: true,
  },
  {
    id: "pref-failed",
    label: "Post failed",
    description: "When a post could not be published and needs attention.",
    enabled: true,
  },
  {
    id: "pref-ai",
    label: "AI recommendations",
    description: "When OREoS finds a new campaign or content opportunity.",
    enabled: true,
  },
  {
    id: "pref-digest",
    label: "Weekly performance digest",
    description: "A summary of reach, engagement and top posts every Monday.",
    enabled: false,
  },
  {
    id: "pref-expiry",
    label: "Account expiry warnings",
    description: "When a connected social account needs to be reauthorized.",
    enabled: true,
  },
  {
    id: "pref-product",
    label: "Product updates",
    description: "Occasional news about new OREoS features.",
    enabled: false,
  },
];

export const billing = {
  plan: "Pro Trial",
  price: "$29/month after trial",
  renewsOn: "Jun 1, 2025",
  creditsUsed: 580,
  creditsTotal: 2000,
  paymentMethod: "Visa ending in 4242",
  invoices: [
    { id: "inv-003", date: "May 1, 2025", amount: "$0.00", label: "Pro Trial" },
    { id: "inv-002", date: "Apr 1, 2025", amount: "$0.00", label: "Pro Trial" },
  ],
};
