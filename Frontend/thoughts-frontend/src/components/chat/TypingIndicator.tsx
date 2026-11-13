import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  className?: string;
  username?: string;
}

export const TypingIndicator = ({ className, username }: TypingIndicatorProps) => {
  return (
    <div className={cn("mb-2 flex animate-fade-msg items-end gap-2", className)}>
      <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-border/70 bg-card px-4 py-2.5 shadow-sm">
        <div className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 animate-typing-1 rounded-full bg-primary" />
          <span className="h-1.5 w-1.5 animate-typing-2 rounded-full bg-primary" />
          <span className="h-1.5 w-1.5 animate-typing-3 rounded-full bg-primary" />
        </div>
        {username && (
          <span className="ml-0.5 text-[11px] font-medium text-muted-foreground">
            {username} is typing
          </span>
        )}
      </div>
    </div>
  );
};
