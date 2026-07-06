# Aura AI — Design System & Dashboard Brief

Derived from the approved reference screenshot + written dashboard spec (2026-07-05).

## Design Brief

**What it is:** The signed-in home screen of Aura AI — an AI marketing-content studio for e-commerce brands.
**Core user action:** Grasp today's content status at a glance and jump into creating/approving campaigns.
**Visual direction:** Modern-minimalist, airy, premium SaaS. High negative space. *Forbidden:* neon, cyberpunk, heavy gradients, heavy shadows, clutter.
**Success looks like:** Matches the reference screenshot's structure and calm density; nothing feels cramped; every section reachable by keyboard.

## Tokens (Tailwind v4 `@theme` in `src/index.css`)

| Token | Value | Use |
|---|---|---|
| `canvas` | `#FAFAF8` | Page background |
| `card` | `#FFFFFF` | Card surfaces |
| `line` | `#ECECEC` | Hairline borders |
| `ink` | `#191B1F` | Primary text |
| `ink-secondary` | `#4B5158` | Secondary text |
| `ink-muted` | `#8A9099` | Muted/meta text |
| `accent` | `#17904F` | Brand green (actions, active nav, positive trends) |
| `accent-soft` | `#E9F6EE` | Soft green fills |
| `warn` / `warn-soft` | `#B45309` / `#FDF3E1` | Pending/warning |
| `info` / `info-soft` | `#2563EB` / `#EAF1FE` | Informational |
| `danger` | `#DC2626` | Errors, notification dot |
| `radius-card` | `20px` | Card corners (18–22px band) |
| `shadow-card` | 2-layer, ≤6% alpha | Resting cards |
| `shadow-lift` | 2-layer, ≤8% alpha | Hover lift |

**Type scale (Inter):** page heading 32/bold · section title 22/semibold · card title 15/semibold · body 14 · muted 13 · KPI value 28/bold.
**Spacing:** 4px base; card padding 20–24px; section gap 24px; page gutter 32px.

## Component Tree

```
App
├── Sidebar (fixed 260px; workspace selector, nav[17], user footer)
├── TopNav (search + ⌘K, Upgrade Plan, notifications bell)
└── DashboardPage
    ├── HeroGreeting (time-aware greeting)
    ├── KpiCard ×6            (label, value, trendLabel, trend, tone)
    ├── UpcomingPosts         (posts: ScheduledPost[]) — table-like rows
    ├── NotificationsCard     (items: NotificationItem[])
    ├── RecentCampaigns → CampaignCard ×4 + CreateCampaignCard (dashed)
    ├── QuickActions          (actions ×5, icon rows)
    └── AiInsights            (insight tiles, wide card)

Primitives: Badge (tone: success|warning|info|neutral) · PlatformIcon (instagram|facebook|tiktok|linkedin)
Data: src/data/mock.ts (typed dummy data) · Types: src/types/index.ts
State: none shared yet — static mock data; Firestore listeners replace mock.ts in a later milestone.
```

## Interactions

Cards: hover lift (`-translate-y-0.5` + `shadow-lift`, 150ms ease). Buttons: hover scale 1.02, active 0.98. Nav: soft-green active pill, hover neutral fill. All interactive elements have visible focus rings (`focus-visible`).

## Responsive

- **≥1280px:** full 3-column composition per reference.
- **768–1279px:** right rail (notifications/quick actions) stacks below main column.
- **<1024px:** sidebar hidden (drawer planned in a later milestone); content single column; KPI grid 2-up.
