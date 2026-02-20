import { Skeleton } from "@/components/ui/skeleton";

export function ProfileSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Avatar + stats row */}
      <div className="px-4 pt-6 pb-4 flex items-start gap-6">
        <Skeleton className="w-20 h-20 rounded-full flex-shrink-0" />
        <div className="flex-1 flex gap-4 mt-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <Skeleton className="h-5 w-10" />
              <Skeleton className="h-3 w-14" />
            </div>
          ))}
        </div>
      </div>

      {/* Name + bio */}
      <div className="px-4 space-y-2 pb-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-3 w-24" />
      </div>

      {/* Follow button */}
      <div className="px-4 pb-5">
        <Skeleton className="h-9 w-full rounded-full" />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-px mt-1">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-none" />
        ))}
      </div>
    </div>
  );
}
