import { cn } from "@/lib/utils";
import type { Conversation } from "@/services/chatApi";
import { formatDistanceToNowStrict } from "date-fns";
import { useChatStore } from "@/store/useChatStore";
import { Check, CheckCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
}

const StatusIcon = ({ status }: { status: string }) => {
  if (status === "seen") return <CheckCheck className="w-3 h-3 text-sky-400" />;
  if (status === "delivered") return <CheckCheck className="w-3 h-3 text-slate-400" />;
  return <Check className="w-3 h-3 text-slate-400" />;
};

const Avatar = ({ src, name }: { src?: string; name: string }) => {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="relative flex-shrink-0">
      {src ? (
        <img
          src={src}
          alt={name}
          className="w-11 h-11 rounded-full object-cover ring-1 ring-slate-700/60"
        />
      ) : (
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm ring-1 ring-slate-700/60">
          {initials}
        </div>
      )}
    </div>
  );
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

  const isOwnMsg = lastMessage && user && (
    lastMessage.senderId === user._id
  );

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
        "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left group",
        "transition-all duration-200 relative",
        "hover:bg-slate-800/60 active:scale-[0.99]",
        isSelected
          ? "bg-slate-800/70"
          : "bg-transparent"
      )}
    >
      {/* Selection accent bar */}
      {isSelected && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 rounded-r-full bg-gradient-to-b from-blue-400 to-indigo-500" />
      )}

      <Avatar src={participant?.avatar} name={participant?.name ?? "?"} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span
            className={cn(
              "font-semibold text-[13px] truncate",
              isSelected ? "text-white" : "text-slate-200"
            )}
          >
            {participant?.name}
          </span>
          <span
            className={cn(
              "text-[10px] flex-shrink-0 ml-2 tabular-nums",
              unreadCount > 0 ? "text-blue-400 font-medium" : "text-slate-500"
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
                "text-xs truncate",
                isTyping
                  ? "text-blue-400 italic font-medium"
                  : unreadCount > 0
                    ? "text-slate-300 font-medium"
                    : "text-slate-500"
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
            <span className="flex-shrink-0 min-w-[18px] h-[18px] rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-[10px] font-bold flex items-center justify-center px-1 shadow-sm shadow-blue-500/20">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};
