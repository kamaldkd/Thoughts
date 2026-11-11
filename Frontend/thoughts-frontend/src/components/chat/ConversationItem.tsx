import { cn } from "@/lib/utils";
import { getMessageSenderId, type Conversation } from "@/services/chatApi";
import { formatDistanceToNowStrict } from "date-fns";
import { useChatStore } from "@/store/useChatStore";
import { Check, CheckCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ParticipantAvatar } from "./ParticipantAvatar";

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
}

const StatusIcon = ({ status }: { status: string }) => {
  if (status === "seen") return <CheckCheck className="h-3 w-3 text-primary" />;
  if (status === "delivered") return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
  return <Check className="h-3 w-3 text-muted-foreground" />;
};

const formatTimeAgo = (dateStr: string): string => {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;

  // Less than 60 seconds
  if (diffMs < 60_000) return "now";

  return formatDistanceToNowStrict(new Date(dateStr), { addSuffix: false });
};

export const ConversationItem = ({ conversation, isSelected, onClick }: ConversationItemProps) => {
  const { user } = useAuth();
  const unreadCount = useChatStore((s) => s.unreadCounts[conversation._id] ?? 0);
  const typingUsers = useChatStore((s) => s.typing[conversation._id]) ?? [];
  const { participant, lastMessage, lastMessageAt } = conversation;

  const senderId = getMessageSenderId(lastMessage?.senderId);
  const ownId = getMessageSenderId(user?._id);
  const isOwnMsg =
    Boolean(lastMessage && user && senderId && ownId && senderId === ownId);

  const isTyping = typingUsers.length > 0;

  const timeStr = lastMessageAt ? formatTimeAgo(lastMessageAt) : "";

  const previewText = lastMessage
    ? lastMessage.content.length > 40
      ? lastMessage.content.slice(0, 37) + "…"
      : lastMessage.content
    : "No messages yet";

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left",
        "transition-colors duration-200 hover:bg-secondary/70 dark:hover:bg-neutral-900",
        isSelected
          ? "bg-secondary dark:bg-neutral-900"
          : "bg-transparent"
      )}
    >
      {/* Selection accent bar */}
      {isSelected && (
        <div className="absolute left-0 top-1/2 h-8 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
      )}

      <ParticipantAvatar
        src={participant?.avatar}
        name={participant?.name || participant?.username || "?"}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span
            className={cn(
              "truncate text-[13px] font-semibold",
              isSelected ? "text-foreground" : "text-foreground/90"
            )}
          >
            {participant?.name}
          </span>
          <span
            className={cn(
              "ml-2 flex-shrink-0 text-[10px] tabular-nums",
              unreadCount > 0 ? "font-medium text-primary" : "text-muted-foreground"
            )}
          >
            {timeStr}
          </span>
        </div>

        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1 min-w-0">
            {isOwnMsg && lastMessage && !isTyping && <StatusIcon status={lastMessage.status} />}
            <span
              className={cn(
                "truncate text-xs",
                isTyping
                  ? "font-medium italic text-primary"
                  : unreadCount > 0
                    ? "font-medium text-foreground"
                    : "text-muted-foreground"
              )}
            >
              {isTyping ? (
                "typing…"
              ) : (
                <>
                  {isOwnMsg ? "You: " : ""}
                  {previewText}
                </>
              )}
            </span>
          </div>

          {unreadCount > 0 && (
            <span className="flex h-[18px] min-w-[18px] flex-shrink-0 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};
