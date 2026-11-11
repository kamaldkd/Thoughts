export function Divider() {
  return (
    <div className="relative my-5">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-border"></div>
      </div>
      <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
        <span className="bg-card px-3 font-medium text-muted-foreground">Or continue with Google</span>
      </div>
    </div>
  );
}
