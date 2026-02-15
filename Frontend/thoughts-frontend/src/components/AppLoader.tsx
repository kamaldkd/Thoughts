export default function AppLoader() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-white">
      {/* Brand */}
      <h1 className="text-3xl font-bold tracking-wide mb-4">
        Thoughts
      </h1>

      {/* Loading bar */}
      <div className="w-40 h-1 bg-gray-700 overflow-hidden rounded">
        <div className="h-full w-1/3 bg-white animate-loader" />
      </div>

      <p className="mt-4 text-sm text-gray-400">
        Loading your feed...
      </p>
    </div>
  );
}