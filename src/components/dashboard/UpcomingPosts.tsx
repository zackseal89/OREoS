import { ArrowRight, Ellipsis } from "lucide-react";
import { PostStatusBadge } from "../ui/Badge";
import { PlatformIcon } from "../ui/PlatformIcon";
import type { ScheduledPost } from "../../types";

export function UpcomingPosts({ posts }: { posts: ScheduledPost[] }) {
  return (
    <section aria-labelledby="upcoming-posts-title" className="surface flex flex-col">
      <header className="flex items-center justify-between px-6 pt-5 pb-4">
        <h2 id="upcoming-posts-title" className="text-[17px] font-semibold">
          Upcoming Posts
        </h2>
        <button
          type="button"
          className="rounded-xl border border-line bg-card px-3.5 py-2 text-[13px] font-medium transition-transform hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-accent"
        >
          View Calendar
        </button>
      </header>

      {posts.length === 0 ? (
        <p className="px-6 pb-6 text-sm text-ink-muted">
          Nothing scheduled yet — create a campaign to get started.
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {posts.map((post) => (
            <li
              key={post.id}
              className="flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-canvas"
            >
              <img
                src={post.thumbnailUrl}
                alt=""
                loading="lazy"
                className="size-12 shrink-0 rounded-xl bg-neutral-100 object-cover"
              />
              <PlatformIcon platform={post.platform} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{post.title}</p>
                <p className="truncate text-[13px] text-ink-muted">{post.format}</p>
              </div>
              <div className="hidden shrink-0 text-right sm:block">
                <p className="text-sm font-medium">{post.dayLabel}</p>
                <p className="text-[13px] text-ink-muted">{post.dateLabel}</p>
              </div>
              <PostStatusBadge status={post.status} />
              <button
                type="button"
                aria-label={`More actions for ${post.title}`}
                className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-neutral-100 hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
              >
                <Ellipsis className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      <footer className="border-t border-line px-6 py-3.5 text-center">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-secondary transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
        >
          View All Scheduled Posts
          <ArrowRight className="size-4" aria-hidden />
        </button>
      </footer>
    </section>
  );
}
