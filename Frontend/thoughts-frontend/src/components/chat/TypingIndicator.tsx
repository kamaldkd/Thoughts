import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  className?: string;
  username?: string;
}

export const TypingIndicator = ({ className, username }: TypingIndicatorProps) => {
  return (
    <div className={cn("flex items-end gap-2 mb-2 animate-fade-msg", className)}>
      <div className="bg-slate-800/90 border border-slate-700/40 rounded-2xl rounded-bl-md px-4 py-2.5 flex items-center gap-2 shadow-md shadow-black/10">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-typing-1" />
          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-typing-2" />
          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-typing-3" />
        </div>
        {username && (
          <span className="text-[11px] text-slate-500 font-medium ml-0.5">
            {username} is typing
          </span>
        )}
      </div>
    </div>
  );
};
