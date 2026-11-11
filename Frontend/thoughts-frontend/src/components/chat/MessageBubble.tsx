import { cn } from "@/lib/utils";
import type { Message } from "@/services/chatApi";
import { format, isToday, isYesterday } from "date-fns";
import { Check, CheckCheck, AlertCircle, RotateCcw } from "lucide-react";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  isFailed?: boolean;
  isSending?: boolean;
  onRetry?: () => void;
}

const StatusTick = ({ status }: { status: Message["status"] }) => {
  if (status === "sent") {
    return <Check className="h-3 w-3 text-primary-foreground/60" />;
  }
  if (status === "delivered") {
    return <CheckCheck className="h-3 w-3 text-primary-foreground/70" />;
  }
  // seen
  return <CheckCheck className="h-3 w-3 text-primary-foreground" />;
};

const formatTime = (dateStr: string) => {
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, "h:mm a");
  if (isYesterday(d)) return `Yesterday ${format(d, "h:mm a")}`;
  return format(d, "MMM d, h:mm a");
};

export const MessageBubble = ({
  message,
  isOwn,
  isFailed = false,
  isSending = false,
  onRetry,
}: MessageBubbleProps) => {
  return (
    <div
      className={cn(
        "group mb-1.5 flex animate-fade-msg items-end gap-2",
        isOwn ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "relative max-w-[82%] rounded-2xl px-3.5 py-2 sm:max-w-[70%] md:max-w-[60%]",
          "break-words text-[13.5px] leading-relaxed",
          "transition-all duration-150",
          isOwn
            ? cn(
                "rounded-br-md bg-primary text-primary-foreground shadow-sm"
              )
            : cn(
                "rounded-bl-md border border-border/70 bg-card text-card-foreground shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
              ),
          isFailed && "animate-pulse-glow ring-1 ring-destructive/50",
          isSending && "opacity-70"
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>

        <div
          className={cn(
            "flex items-center gap-1 mt-0.5",
            isOwn ? "justify-end" : "justify-start"
          )}
        >
          <span
            className={cn(
              "text-[10px] transition-opacity",
              isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
            )}
          >
            {formatTime(message.createdAt)}
          </span>

          {isOwn && !isFailed && (
            <span className={cn("transition-opacity", isSending ? "opacity-40" : "opacity-100")}>
              <StatusTick status={isSending ? "sent" : message.status} />
            </span>
          )}

          {isFailed && (
            <AlertCircle className="h-3 w-3 text-destructive" />
          )}
        </div>

        {/* Failed overlay */}
        {isFailed && (
          <button
            onClick={onRetry}
            className={cn(
              "mb-0.5 mt-1 flex cursor-pointer items-center gap-1.5 text-[11px] font-medium",
              "text-destructive transition-colors hover:text-destructive/80"
            )}
          >
            <RotateCcw className="h-3 w-3" />
            Tap to retry
          </button>
        )}
      </div>
    </div>
  );
};
