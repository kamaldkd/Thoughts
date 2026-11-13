export default function ThoughtSkeleton() {
  return (
    <div className="animate-pulse border-b border-border">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="h-10 w-10 rounded-full bg-muted" />
        <div className="space-y-2">
          <div className="h-3 w-24 rounded bg-muted" />
          <div className="h-2 w-16 rounded bg-muted" />
        </div>
      </div>

      {/* Content */}
      <div className="mb-3 h-32 rounded bg-muted" />

      {/* Actions */}
      <div className="flex gap-4">
        <div className="h-3 w-10 rounded bg-muted" />
        <div className="h-3 w-10 rounded bg-muted" />
      </div>
    </div>
  );
}