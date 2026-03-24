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
  if (status === "seen") return <CheckCheck className="w-3 h-3 text-blue-400" />;
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
          className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-700"
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm ring-2 ring-slate-700">
          {initials}
        </div>
      )}
    </div>
  );
};

export const ConversationItem = ({ conversation, isSelected, onClick }: ConversationItemProps) => {
  const { user } = useAuth();
  const unreadCount = useChatStore((s) => s.unreadCounts[conversation._id] ?? 0);
  const { participant, lastMessage, lastMessageAt } = conversation;

  const isOwnMsg = lastMessage && user && (
    lastMessage.senderId === user._id
  );

  const timeStr = lastMessageAt
    ? formatDistanceToNowStrict(new Date(lastMessageAt), { addSuffix: false })
    : "";

  const previewText = lastMessage
    ? lastMessage.content.length > 40
      ? lastMessage.content.slice(0, 37) + "…"
      : lastMessage.content
    : "No messages yet";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left group",
        "hover:bg-slate-700/50 active:scale-[0.99]",
        isSelected ? "bg-slate-700/60 ring-1 ring-blue-500/30" : "bg-transparent"
      )}
    >
      <Avatar src={participant?.avatar} name={participant?.name ?? "?"} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span
            className={cn(
              "font-semibold text-sm truncate",
              isSelected ? "text-white" : "text-slate-200"
            )}
          >
            {participant?.name}
          </span>
          <span className="text-[10px] text-slate-500 flex-shrink-0 ml-2">{timeStr}</span>
        </div>

        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1 min-w-0">
            {isOwnMsg && lastMessage && <StatusIcon status={lastMessage.status} />}
            <span
              className={cn(
                "text-xs truncate",
                unreadCount > 0 ? "text-slate-200 font-medium" : "text-slate-500"
              )}
            >
              {isOwnMsg ? "You: " : ""}
              {previewText}
            </span>
          </div>

          {unreadCount > 0 && (
            <span className="flex-shrink-0 min-w-[18px] h-[18px] rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};
