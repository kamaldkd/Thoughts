import { cn } from "@/lib/utils";

export const TypingIndicator = ({ className }: { className?: string }) => {
  return (
    <div className={cn("flex items-end gap-2 mb-1", className)}>
      <div className="bg-slate-700/80 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1 shadow-sm">
        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-typing-1" />
        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-typing-2" />
        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-typing-3" />
      </div>
    </div>
  );
};
