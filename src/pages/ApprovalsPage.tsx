import { CircleCheck } from "lucide-react";
import { TopNav } from "../components/layout/TopNav";
import { notifications } from "../data/mock";

export function ApprovalsPage() {
  return (
    <>
      <TopNav notificationCount={notifications.length} />
      <main className="flex flex-1 flex-col items-center justify-center px-8 py-16">
        <div className="surface flex max-w-md w-full flex-col items-center p-12 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-accent-soft text-accent-deep">
            <CircleCheck className="size-8" aria-hidden />
          </span>
          <h1 className="mt-5 text-2xl font-bold tracking-tight">Approvals</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
            The approvals queue will appear here once your team has content pending sign-off.
            Connect your team members in{" "}
            <a href="/settings?tab=team" className="font-medium text-accent hover:underline">
              Settings → Team
            </a>{" "}
            to get started.
          </p>
          <div className="mt-8 flex w-full flex-col gap-3 rounded-2xl border border-line bg-canvas p-5 text-left">
            <p className="text-[13px] font-semibold text-ink-secondary">Coming in a later milestone:</p>
            <ul className="space-y-1.5 text-[13px] text-ink-muted">
              <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-accent-soft ring-1 ring-accent shrink-0" /> Review & approve AI-generated assets</li>
              <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-accent-soft ring-1 ring-accent shrink-0" /> Leave inline comments on images & copy</li>
              <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-accent-soft ring-1 ring-accent shrink-0" /> One-click approve or request revisions</li>
            </ul>
          </div>
        </div>
      </main>
    </>
  );
}
