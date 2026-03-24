import { cn } from "@/lib/utils";
import type { Message } from "@/services/chatApi";
import { format, isToday, isYesterday } from "date-fns";
import { Check, CheckCheck } from "lucide-react";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
}

const StatusTick = ({ status }: { status: Message["status"] }) => {
  if (status === "sent") {
    return <Check className="w-3 h-3 text-slate-400" />;
  }
  if (status === "delivered") {
    return <CheckCheck className="w-3 h-3 text-slate-400" />;
  }
  // seen
  return <CheckCheck className="w-3 h-3 text-blue-400" />;
};

const formatTime = (dateStr: string) => {
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, "h:mm a");
  if (isYesterday(d)) return `Yesterday ${format(d, "h:mm a")}`;
  return format(d, "MMM d, h:mm a");
};

export const MessageBubble = ({ message, isOwn }: MessageBubbleProps) => {
  const isTemp = Boolean(message.tempId) && !message._id.startsWith("6"); // temp messages have uuid tempId

  return (
    <div
      className={cn(
        "flex items-end gap-2 mb-3 group animate-slide-up",
        isOwn ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div
        className={cn(
          "relative max-w-[65%] md:max-w-[50%] px-4 py-2.5 rounded-2xl shadow-md",
          "text-sm leading-relaxed break-words",
          isOwn
            ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-md"
            : "bg-slate-700/80 text-slate-100 rounded-bl-md backdrop-blur-sm"
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>

        <div
          className={cn(
            "flex items-center gap-1 mt-1",
            isOwn ? "justify-end" : "justify-start"
          )}
        >
          <span className={cn("text-[10px]", isOwn ? "text-blue-200/70" : "text-slate-400")}>
            {formatTime(message.createdAt)}
          </span>
          {isOwn && (
            <span className={cn("transition-opacity", isTemp ? "opacity-40" : "opacity-100")}>
              <StatusTick status={isTemp ? "sent" : message.status} />
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
