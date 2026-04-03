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
    return <Check className="w-3 h-3 text-blue-200/50" />;
  }
  if (status === "delivered") {
    return <CheckCheck className="w-3 h-3 text-blue-200/60" />;
  }
  // seen
  return <CheckCheck className="w-3 h-3 text-sky-300" />;
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
        "flex items-end gap-2 mb-1.5 group animate-fade-msg",
        isOwn ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div
        className={cn(
          "relative max-w-[70%] md:max-w-[55%] px-3.5 py-2 rounded-2xl",
          "text-[13.5px] leading-relaxed break-words",
          "transition-all duration-150",
          isOwn
            ? cn(
                "bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-md",
                "shadow-lg shadow-blue-900/20"
              )
            : cn(
                "bg-slate-800/90 text-slate-100 rounded-bl-md",
                "shadow-md shadow-black/10 backdrop-blur-sm",
                "border border-slate-700/40"
              ),
          isFailed && "animate-pulse-glow ring-1 ring-red-500/50",
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
              isOwn ? "text-blue-200/60" : "text-slate-500"
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
            <AlertCircle className="w-3 h-3 text-red-400" />
          )}
        </div>

        {/* Failed overlay */}
        {isFailed && (
          <button
            onClick={onRetry}
            className={cn(
              "flex items-center gap-1.5 mt-1 -mb-0.5 text-[11px] font-medium",
              "text-red-300 hover:text-red-200 transition-colors cursor-pointer"
            )}
          >
            <RotateCcw className="w-3 h-3" />
            Tap to retry
          </button>
        )}
      </div>
    </div>
  );
};
