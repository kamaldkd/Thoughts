import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { getMessageSenderId, type Message } from "@/services/chatApi";
import { format, isToday, isYesterday } from "date-fns";
import {
  Check,
  CheckCheck,
  AlertCircle,
  RotateCcw,
  Reply,
  MoreHorizontal,
} from "lucide-react";

interface MessageBubbleProps {
  id?: string;
  message: Message;
  isOwn: boolean;
  isFailed?: boolean;
  isSending?: boolean;
  onRetry?: () => void;
  onReply?: () => void;
  onLongPress?: () => void;
  onQuoteClick?: (messageId: string) => void;
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
  return format(d, "h:mm a");
};

export const MessageBubble = ({
  id,
  message,
  isOwn,
  isFailed = false,
  isSending = false,
  onRetry,
  onReply,
  onLongPress,
  onQuoteClick,
}: MessageBubbleProps) => {
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const replyTarget =
    message.replyTo && typeof message.replyTo === "object" ? message.replyTo : null;
  const replySenderName =
    replyTarget && typeof replyTarget.senderId === "object"
      ? getMessageSenderId(replyTarget.senderId) === getMessageSenderId(message.senderId)
        ? "You"
        : replyTarget.senderId.name || replyTarget.senderId.username
      : "Message";

  useEffect(
    () => () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
    },
    []
  );

  const handleTouchStart = (event: React.TouchEvent) => {
    if (!onReply && !onLongPress) return;
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
    longPressTriggered.current = false;
    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        longPressTriggered.current = true;
        setSwipeOffset(0);
        onLongPress();
      }, 550);
    }
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    if (!touchStart.current) return;
    const touch = event.touches[0];
    const offset = touch.clientX - touchStart.current.x;
    const verticalOffset = touch.clientY - touchStart.current.y;
    if (Math.abs(offset) > 8 || Math.abs(verticalOffset) > 8) {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
    }
    if (
      onReply &&
      offset > 0 &&
      Math.abs(offset) > Math.abs(verticalOffset)
    ) {
      setSwipeOffset(Math.min(offset, 76));
    }
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (!touchStart.current) return;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStart.current.x;
    const deltaY = touch.clientY - touchStart.current.y;
    if (!longPressTriggered.current && onReply && deltaX >= 56 && deltaX > Math.abs(deltaY) * 1.3) {
      onReply();
    }
    touchStart.current = null;
    setSwipeOffset(0);
  };

  const handleTouchCancel = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    touchStart.current = null;
    longPressTriggered.current = false;
    setSwipeOffset(0);
  };

  return (
    <div
      id={id}
      aria-description="Press and hold for message actions"
      className={cn(
        "group mb-1.5 flex select-none animate-fade-msg items-end gap-2",
        isOwn ? "justify-end" : "justify-start"
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      onContextMenu={(event) => {
        if (!onLongPress) return;
        event.preventDefault();
        onLongPress();
      }}
    >
      {(onReply || onLongPress) && (
        <div
          className={cn(
            "flex flex-shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100",
            isOwn ? "order-first" : "order-last"
          )}
        >
          {onReply && (
            <button
              type="button"
              onClick={onReply}
              aria-label="Reply to message"
              className="h-8 w-8 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Reply className="mx-auto h-4 w-4" />
            </button>
          )}
          {onLongPress && (
            <button
              type="button"
              onClick={onLongPress}
              aria-label="Message actions"
              className="h-8 w-8 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <MoreHorizontal className="mx-auto h-4 w-4" />
            </button>
          )}
        </div>
      )}
      <div
        className={cn(
          "relative max-w-[82%] rounded-2xl px-3.5 py-2 sm:max-w-[70%] md:max-w-[60%]",
          "touch-pan-y break-words text-[13.5px] leading-relaxed",
          "transition-[transform,opacity] duration-150",
          isOwn
            ? cn(
                "rounded-br-md bg-primary text-primary-foreground shadow-sm"
              )
            : cn(
                "rounded-bl-md border border-border/70 bg-card text-card-foreground shadow-sm"
              ),
          isFailed && "animate-pulse-glow ring-1 ring-destructive/50",
          isSending && "opacity-70"
        )}
        style={{ transform: `translateX(${swipeOffset}px)` }}
      >
        {replyTarget && !message.isDeleted && (
          <button
            type="button"
            onClick={() => onQuoteClick?.(replyTarget._id)}
            disabled={!onQuoteClick}
            className={cn(
              "mb-1.5 block w-full rounded-md border-l-2 px-2 py-1 text-left",
              isOwn
                ? "border-primary-foreground/70 bg-black/10"
                : "border-primary bg-secondary/70",
              onQuoteClick && "cursor-pointer hover:opacity-80"
            )}
          >
            <span
              className={cn(
                "block truncate text-[10px] font-semibold",
                isOwn ? "text-primary-foreground" : "text-primary"
              )}
            >
              {replySenderName}
            </span>
            <span
              className={cn(
                "block line-clamp-2 whitespace-pre-wrap break-words text-[11px]",
                isOwn ? "text-primary-foreground/80" : "text-muted-foreground"
              )}
            >
              {replyTarget.isDeleted ? "Message deleted" : replyTarget.content}
            </span>
          </button>
        )}
        <p className={cn("whitespace-pre-wrap", message.isDeleted && "italic opacity-75")}>
          {message.isDeleted
            ? isOwn
              ? "You deleted this message"
              : "This message was deleted"
            : message.content}
        </p>

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

          {isOwn && !isFailed && !message.isDeleted && (
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
