export function SkeletonCard() {
  return (
    <div className="surface animate-pulse overflow-hidden" aria-hidden>
      <div className="aspect-video bg-neutral-100" />
      <div className="space-y-3 p-5">
        <div className="h-4 w-3/4 rounded-full bg-neutral-100" />
        <div className="h-3 w-full rounded-full bg-neutral-100" />
        <div className="h-3 w-2/3 rounded-full bg-neutral-100" />
        <div className="flex gap-1.5 pt-1">
          <div className="size-7 rounded-full bg-neutral-100" />
          <div className="size-7 rounded-full bg-neutral-100" />
          <div className="size-7 rounded-full bg-neutral-100" />
        </div>
        <div className="h-3 w-1/2 rounded-full bg-neutral-100" />
        <div className="h-1.5 w-full rounded-full bg-neutral-100" />
      </div>
    </div>
  );
}
