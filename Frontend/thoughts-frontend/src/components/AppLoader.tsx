export default function AppLoader() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background text-foreground">
      {/* Brand */}
      <h1 className="text-3xl font-bold tracking-wide mb-4">
        Thoughts
      </h1>

      {/* Loading bar */}
      <div className="w-40 h-1 overflow-hidden rounded bg-muted">
        <div className="h-full w-1/3 animate-loader bg-primary" />
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        Loading Thoughts...
      </p>
    </div>
  );
}