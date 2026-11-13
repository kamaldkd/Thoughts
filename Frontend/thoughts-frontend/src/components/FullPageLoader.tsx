export default function FullPageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background text-foreground">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-primary"></div>
    </div>
  );
}