import type { ReactNode } from "react";

export const inputClasses =
  "w-full rounded-xl border border-line bg-card px-3.5 py-2.5 text-sm placeholder:text-ink-muted focus:border-accent focus:outline-2 focus:outline-accent/30 disabled:bg-canvas disabled:text-ink-muted";

interface FieldProps {
  label: string;
  hint?: string;
  children: ReactNode;
}

export function Field({ label, hint, children }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-ink-secondary">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-ink-muted">{hint}</span>}
    </label>
  );
}
