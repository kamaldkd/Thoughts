import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import { useChatStore } from "@/store/useChatStore";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { TypingIndicator } from "./TypingIndicator";
import { joinConversation, leaveConversation, emitSendMessage, emitMarkAsSeen } from "@/services/socket";
import { getMessages } from "@/services/chatApi";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { ArrowLeft, Loader2, AlertTriangle, ChevronDown } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import type { Message } from "@/services/chatApi";
import { v4 as uuidv4 } from 'uuid';
import { toast } from "sonner";

interface ChatWindowProps {
  conversationId: string;
  onBack?: () => void;
}

/* ─────────────────────────────────────────────
   DATE SEPARATOR
───────────────────────────────────────────── */
const DateSeparator = ({ date }: { date: string }) => {
  const d = new Date(date);
  const label = isToday(d) ? "Today" : isYesterday(d) ? "Yesterday" : format(d, "MMMM d, yyyy");
  return (
    <div className="flex items-center justify-center my-4">
      <span className="px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/40 text-[11px] text-slate-400 font-medium shadow-sm">
        {label}
      </span>
    </div>
  );
};

/* ─────────────────────────────────────────────
   GROUP MESSAGES BY DATE
───────────────────────────────────────────── */
const groupByDate = (messages: Message[]) => {
  const groups: { date: string; messages: Message[] }[] = [];
  // messages are newest-first from API, so we reverse for display
  const sorted = [...messages].reverse();
  let lastDate = "";

  for (const msg of sorted) {
    const dateKey = format(new Date(msg.createdAt), "yyyy-MM-dd");
    if (dateKey !== lastDate) {
      groups.push({ date: msg.createdAt, messages: [msg] });
      lastDate = dateKey;
    } else {
      groups[groups.length - 1].messages.push(msg);
    }
  }
  return groups;
};

/* ─────────────────────────────────────────────
   SKELETON LOADER
───────────────────────────────────────────── */
const MessageSkeleton = () => {
  const widths = ["w-52", "w-36", "w-44", "w-28", "w-60", "w-40", "w-32", "w-48"];
  const heights = ["h-10", "h-12", "h-8", "h-14", "h-10", "h-9", "h-11", "h-10"];
  return (
    <div className="space-y-3 py-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className={cn("flex", i % 3 === 0 ? "justify-start" : "justify-end")}>
          <div
            className={cn(
              "rounded-2xl bg-slate-800/50 animate-pulse",
              widths[i % widths.length],
              heights[i % heights.length],
              i % 3 === 0 ? "rounded-bl-md" : "rounded-br-md"
            )}
          />
        </div>
      ))}
    </div>
  );
};

/* ─────────────────────────────────────────────
   SCROLL-TO-BOTTOM FAB
───────────────────────────────────────────── */
const ScrollToBottomFAB = ({
  visible,
  unreadBelow,
  onClick,
}: {
  visible: boolean;
  unreadBelow: number;
  onClick: () => void;
}) => {
  if (!visible) return null;
  return (
    <button
      onClick={onClick}
      className={cn(
        "absolute bottom-20 right-6 z-20",
        "w-10 h-10 rounded-full",
        "bg-slate-800/90 border border-slate-700/60 backdrop-blur-md",
        "flex items-center justify-center",
        "shadow-lg shadow-black/20",
        "hover:bg-slate-700/90 hover:scale-105 active:scale-95",
        "transition-all duration-200",
        "animate-bounce-in-fab"
      )}
    >
      <ChevronDown className="w-5 h-5 text-slate-300" />
      {unreadBelow > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-[10px] font-bold flex items-center justify-center px-1 shadow-sm">
          {unreadBelow > 99 ? "99+" : unreadBelow}
        </span>
      )}
    </button>
  );
};

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export const ChatWindow = ({ conversationId, onBack }: ChatWindowProps) => {
  const { user } = useAuth();

  // Store actions
  const setMessages = useChatStore((s) => s.setMessages);
  const prependMessages = useChatStore((s) => s.prependMessages);
  const setLoadingMore = useChatStore((s) => s.setLoadingMore);
  const appendMessage = useChatStore((s) => s.appendMessage);
  const updateLastMessage = useChatStore((s) => s.updateLastMessage);
  const replaceTempMessage = useChatStore((s) => s.replaceTempMessage);
  const clearUnread = useChatStore((s) => s.clearUnread);
  const markMessageFailed = useChatStore((s) => s.markMessageFailed);
  const clearFailedMessage = useChatStore((s) => s.clearFailedMessage);
  const removeFailedMessage = useChatStore((s) => s.removeFailedMessage);

  // Store state
  const conversation = useChatStore((s) => s.conversations.find((c) => c._id === conversationId));
  const messages = useChatStore((s) => s.messageStore[conversationId]?.messages) || [];
  const typingUsers = useChatStore((s) => s.typing[conversationId]) || [];
  const pagination = useChatStore((s) => s.messageStore[conversationId]?.pagination);
  const loadingMore = useChatStore((s) => s.messageStore[conversationId]?.loadingMore) || false;
  const failedIds = useChatStore((s) => s.failedMessageIds[conversationId]);

  const [initialLoading, setInitialLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [showScrollFAB, setShowScrollFAB] = useState(false);
  const [unreadBelow, setUnreadBelow] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevScrollHeight = useRef(0);
  const markedSeen = useRef(false);

  const participant = conversation?.participant;

  // Memoize date grouping
  const grouped = useMemo(() => groupByDate(messages), [messages]);

  // Get typing username(s)
  const typingUsername = useMemo(() => {
    if (typingUsers.length === 0 || !participant) return undefined;
    return participant.name?.split(" ")[0]; // Just first name
  }, [typingUsers, participant]);

  /* ─────────────────────────────────────────────
     INITIAL LOAD
  ───────────────────────────────────────────── */
  useEffect(() => {
    markedSeen.current = false;
    setInitialLoading(true);
    setShowScrollFAB(false);
    setUnreadBelow(0);

    joinConversation(conversationId);

    getMessages(conversationId, 1, 20)
      .then(({ messages, pagination }) => {
        setMessages(conversationId, messages, pagination);
        clearUnread(conversationId);
        setErrorStatus(null);
      })
      .catch((err) => {
        console.error("Chat load error:", err);
        setErrorStatus(err?.response?.status || 500);
        toast.error("Failed to load conversation");
      })
      .finally(() => setInitialLoading(false));

    return () => {
      leaveConversation(conversationId);
    };
  }, [conversationId, setMessages, clearUnread]);

  /* ─────────────────────────────────────────────
     AUTO-SCROLL on new messages (only if near bottom)
  ───────────────────────────────────────────── */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || initialLoading) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distFromBottom < 200) {
      el.scrollTop = el.scrollHeight;
    } else {
      // User is scrolled up, show FAB and count unread
      setUnreadBelow((prev) => prev + 1);
    }
  }, [messages.length, initialLoading]);

  /* First load — scroll to bottom */
  useEffect(() => {
    if (!initialLoading && messages.length > 0) {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [initialLoading]);

  /* ─────────────────────────────────────────────
     MARK AS SEEN
  ───────────────────────────────────────────── */
  useEffect(() => {
    if (messages.length > 0 && !markedSeen.current) {
      markedSeen.current = true;
      emitMarkAsSeen(conversationId).catch(console.error);
      clearUnread(conversationId);
    }
  }, [messages.length, conversationId, clearUnread]);

  /* ─────────────────────────────────────────────
     SCROLL HANDLER — infinite scroll + FAB visibility
  ───────────────────────────────────────────── */
  const handleScroll = useCallback(async () => {
    const el = scrollRef.current;
    if (!el) return;

    // FAB visibility
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollFAB(distFromBottom > 300);
    if (distFromBottom < 100) {
      setUnreadBelow(0);
    }

    // Infinite scroll (load older)
    if (loadingMore || !pagination?.hasNextPage) return;
    if (el.scrollTop < 60) {
      prevScrollHeight.current = el.scrollHeight;
      setLoadingMore(conversationId, true);
      try {
        const nextPage = (pagination.page ?? 1) + 1;
        const { messages: older, pagination: newPag } = await getMessages(conversationId, nextPage, 20);
        prependMessages(conversationId, older, newPag);
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop =
              scrollRef.current.scrollHeight - prevScrollHeight.current;
          }
        });
      } catch (err) {
        console.error("Failed to load more messages", err);
        setLoadingMore(conversationId, false);
      }
    }
  }, [conversationId, loadingMore, pagination, prependMessages, setLoadingMore]);

  /* ─────────────────────────────────────────────
     SCROLL TO BOTTOM
  ───────────────────────────────────────────── */
  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
    setShowScrollFAB(false);
    setUnreadBelow(0);
  }, []);

  /* ─────────────────────────────────────────────
     SEND MESSAGE
  ───────────────────────────────────────────── */
  const handleSend = useCallback(
    async (content: string) => {
      if (!user) return;
      const tempId = uuidv4();

      // Optimistic message
      const optimistic: Message = {
        _id: tempId,
        conversationId,
        senderId: { _id: user._id, username: user.username, name: user.name, avatar: user.avatar },
        content,
        messageType: "text",
        status: "sent",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tempId,
      };

      appendMessage(conversationId, optimistic);
      updateLastMessage(conversationId, optimistic);

      // Scroll to bottom immediately
      requestAnimationFrame(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      });

      try {
        const ack = await emitSendMessage(conversationId, content, tempId);
        if (ack.success && ack.message) {
          replaceTempMessage(conversationId, tempId, { ...ack.message, tempId: undefined });
          updateLastMessage(conversationId, ack.message);
        } else {
          markMessageFailed(conversationId, tempId);
        }
      } catch (err) {
        console.error("Failed to send message", err);
        markMessageFailed(conversationId, tempId);
      }
    },
    [user, conversationId, appendMessage, updateLastMessage, replaceTempMessage, markMessageFailed]
  );

  /* ─────────────────────────────────────────────
     RETRY FAILED MESSAGE
  ───────────────────────────────────────────── */
  const handleRetry = useCallback(
    async (msg: Message) => {
      if (!msg.tempId) return;
      clearFailedMessage(conversationId, msg.tempId);
      removeFailedMessage(conversationId, msg.tempId);
      // Re-send
      handleSend(msg.content);
    },
    [conversationId, clearFailedMessage, removeFailedMessage, handleSend]
  );

  /* ─────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────── */
  if (errorStatus) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-950/50 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-400/80" />
        </div>
        <h3 className="text-lg font-semibold text-slate-200">
          {errorStatus === 403 || errorStatus === 401 ? "Access Denied" : "Conversation Not Found"}
        </h3>
        <p className="text-slate-500 text-sm max-w-sm text-center">
          You don't have permission to view this conversation or it doesn't exist.
        </p>
        <button
          onClick={onBack}
          className="mt-2 px-6 py-2.5 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors text-sm font-medium"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!conversation && !errorStatus) {
    return (
      <div className="flex flex-col h-full bg-slate-950/50 items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!conversation) return null;

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900/90">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800/60 backdrop-blur-md z-10 w-full">
        {onBack && (
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all duration-200 md:hidden"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        {participant?.avatar ? (
          <img
            src={participant.avatar}
            alt={participant.name}
            className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-700/60"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold ring-1 ring-slate-700/60">
            {participant?.name?.[0]?.toUpperCase() ?? "?"}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[13.5px] text-slate-100 truncate">{participant?.name}</p>
          {typingUsers.length > 0 ? (
            <p className="text-xs text-blue-400 font-medium animate-fade-in truncate">typing…</p>
          ) : (
            <p className="text-xs text-slate-500 truncate">@{participant?.username}</p>
          )}
        </div>
      </div>

      {/* ── Chat Content ── */}
      <div className="flex-1 flex justify-center overflow-hidden relative">
        <div className="w-full max-w-3xl px-4 flex flex-col h-full relative">

          {/* ── Messages area ── */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto pt-4 pb-2 chat-scrollbar"
          >
            {/* Load more spinner */}
            {loadingMore && (
              <div className="flex justify-center py-3">
                <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
              </div>
            )}

            {initialLoading ? (
              <MessageSkeleton />
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-16">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600/10 to-indigo-600/10 flex items-center justify-center border border-blue-500/10">
                  <span className="text-2xl">💬</span>
                </div>
                <div>
                  <p className="text-slate-300 text-sm font-medium">
                    No messages yet
                  </p>
                  <p className="text-slate-500 text-xs mt-1">
                    Say hi to{" "}
                    <span className="text-blue-400 font-medium">{participant?.name}</span>!
                  </p>
                </div>
              </div>
            ) : (
              grouped.map((group, gi) => (
                <div key={gi}>
                  <DateSeparator date={group.date} />
                  {group.messages.map((msg) => {
                    const senderId =
                      typeof msg.senderId === "object" ? msg.senderId._id : msg.senderId;
                    const isOwn = senderId === user?._id;
                    const isFailed = Boolean(msg.tempId && failedIds?.has(msg.tempId));
                    const isSending = Boolean(msg.tempId && !isFailed && !failedIds?.has(msg.tempId));

                    return (
                      <MessageBubble
                        key={msg._id}
                        message={msg}
                        isOwn={isOwn}
                        isFailed={isFailed}
                        isSending={isSending && isOwn}
                        onRetry={() => handleRetry(msg)}
                      />
                    );
                  })}
                </div>
              ))
            )}

            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <TypingIndicator username={typingUsername} />
            )}
          </div>

          {/* Scroll-to-bottom FAB */}
          <ScrollToBottomFAB
            visible={showScrollFAB}
            unreadBelow={unreadBelow}
            onClick={scrollToBottom}
          />

          {/* ── Input ── */}
          <div className="pb-4 pt-2">
            <MessageInput
              conversationId={conversationId}
              onSend={handleSend}
              disabled={initialLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
