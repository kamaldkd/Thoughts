export function SkeletonCard() {
  return (
    <div className="py-4 border-b border-border/60">
      <div className="flex gap-3">
        <div className="h-10 w-10 rounded-full animate-shimmer flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="flex gap-2">
            <div className="h-4 w-24 rounded animate-shimmer" />
            <div className="h-4 w-10 rounded animate-shimmer" />
          </div>
          <div className="h-4 w-full rounded animate-shimmer" />
          <div className="h-4 w-3/4 rounded animate-shimmer" />
          <div className="h-48 w-full rounded-xl animate-shimmer" />
        </div>
      </div>
    </div>
  );
}
