import { CreditCard, Download, Sparkles } from "lucide-react";
import { billing } from "../../data/settings";

export function BillingSection({ onSave }: { onSave: (message: string) => void }) {
  const creditsLeft = billing.creditsTotal - billing.creditsUsed;
  const usedPct = Math.round((billing.creditsUsed / billing.creditsTotal) * 100);

  return (
    <div className="space-y-6">
      <section className="surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-[17px] font-semibold">Current plan</h2>
            <p className="mt-2 flex items-center gap-2">
              <span className="text-2xl font-bold tracking-tight">{billing.plan}</span>
              <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent-deep">
                Trial
              </span>
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              {billing.price} · Renews {billing.renewsOn}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSave("Plan upgrades arrive with the billing milestone.")}
            className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-accent-deep"
          >
            <Sparkles className="size-4" aria-hidden />
            Upgrade Plan
          </button>
        </div>

        {/* Credits */}
        <div className="mt-6 border-t border-line pt-5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">AI credits</span>
            <span className="text-ink-muted">
              {creditsLeft.toLocaleString()} of {billing.creditsTotal.toLocaleString()} remaining
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={usedPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="AI credits used"
            className="mt-2.5 h-2 overflow-hidden rounded-full bg-neutral-100"
          >
            <div className="h-full rounded-full bg-accent" style={{ width: `${usedPct}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-ink-muted">
            {usedPct}% used this cycle · Resets {billing.renewsOn}
          </p>
        </div>
      </section>

      <section className="surface p-6">
        <h2 className="text-[17px] font-semibold">Payment method</h2>
        <div className="mt-4 flex items-center gap-3.5">
          <span className="flex size-10 items-center justify-center rounded-xl bg-info-soft text-info">
            <CreditCard className="size-5" aria-hidden />
          </span>
          <p className="flex-1 text-sm font-medium">{billing.paymentMethod}</p>
          <button
            type="button"
            onClick={() => onSave("Payment methods arrive with the billing milestone.")}
            className="rounded-xl border border-line bg-card px-3.5 py-2 text-[13px] font-medium transition-transform hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-accent"
          >
            Update
          </button>
        </div>
      </section>

      <section className="surface p-6">
        <h2 className="text-[17px] font-semibold">Billing history</h2>
        <ul className="mt-4 divide-y divide-line">
          {billing.invoices.map((invoice) => (
            <li key={invoice.id} className="flex items-center gap-4 py-3.5 text-sm">
              <span className="flex-1 font-medium">{invoice.date}</span>
              <span className="text-ink-muted">{invoice.label}</span>
              <span className="w-16 text-right font-medium">{invoice.amount}</span>
              <button
                type="button"
                aria-label={`Download invoice from ${invoice.date}`}
                onClick={() => onSave("Invoice downloads arrive with the billing milestone.")}
                className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-neutral-100 hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
              >
                <Download className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
