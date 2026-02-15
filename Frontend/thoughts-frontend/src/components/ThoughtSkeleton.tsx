export default function ThoughtSkeleton() {
  return (
    <div className="p-4 border-b border-gray-800 animate-pulse ">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-gray-700 rounded-full" />
        <div className="space-y-2">
          <div className="h-3 w-24 bg-gray-700 rounded" />
          <div className="h-2 w-16 bg-gray-700 rounded" />
        </div>
      </div>

      {/* Content */}
      <div className="h-32 bg-gray-700 rounded mb-3" />

      {/* Actions */}
      <div className="flex gap-4">
        <div className="h-3 w-10 bg-gray-700 rounded" />
        <div className="h-3 w-10 bg-gray-700 rounded" />
      </div>
    </div>
  );
}