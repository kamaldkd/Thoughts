export function Divider() {
  return (
    <div className="relative my-7">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-slate-800"></div>
      </div>
      <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
        <span className="bg-slate-950 px-3 text-slate-500 font-medium">Or continue with email</span>
      </div>
    </div>
  );
}
