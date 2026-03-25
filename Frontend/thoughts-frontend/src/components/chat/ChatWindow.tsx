import { useEffect, useRef, useCallback, useState } from "react";
import { useChatStore, selectMessages, selectTypingUsers } from "@/store/useChatStore";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { TypingIndicator } from "./TypingIndicator";
import { joinConversation, leaveConversation, emitSendMessage, emitMarkAsSeen } from "@/services/socket";
import { getMessages } from "@/services/chatApi";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { ArrowLeft, Loader2, Circle, AlertTriangle } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import type { Message } from "@/services/chatApi";
import { v4 as uuidv4 } from 'uuid';
import { toast } from "sonner";

interface ChatWindowProps {
  conversationId: string;
  onBack?: () => void;
}

const DateSeparator = ({ date }: { date: string }) => {
  const d = new Date(date);
  const label = isToday(d) ? "Today" : isYesterday(d) ? "Yesterday" : format(d, "MMMM d, yyyy");
  return (
    <div className="flex items-center gap-3 my-3 px-2">
      <div className="flex-1 h-px bg-slate-700/50" />
      <span className="text-[10px] text-slate-500 font-medium">{label}</span>
      <div className="flex-1 h-px bg-slate-700/50" />
    </div>
  );
};

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

export const ChatWindow = ({ conversationId, onBack }: ChatWindowProps) => {
  const { user } = useAuth();
  
  // Extract individual actions
  const setMessages = useChatStore((s) => s.setMessages);
  const prependMessages = useChatStore((s) => s.prependMessages);
  const setLoadingMore = useChatStore((s) => s.setLoadingMore);
  const appendMessage = useChatStore((s) => s.appendMessage);
  const updateLastMessage = useChatStore((s) => s.updateLastMessage);
  const replaceTempMessage = useChatStore((s) => s.replaceTempMessage);
  const clearUnread = useChatStore((s) => s.clearUnread);
  const conversation = useChatStore((s) => s.conversations.find((c) => c._id === conversationId));
  const messages = useChatStore((s) => s.messageStore[conversationId]?.messages) || [];
  const typingUsers = useChatStore((s) => s.typing[conversationId]) || [];
  const pagination = useChatStore((s) => s.messageStore[conversationId]?.pagination);
  const loadingMore = useChatStore((s) => s.messageStore[conversationId]?.loadingMore) || false;

  const [initialLoading, setInitialLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevScrollHeight = useRef(0);
  const markedSeen = useRef(false);

  const participant = conversation?.participant;

  /* ─────────────────────────────────────────────
     INITIAL LOAD
  ───────────────────────────────────────────── */
  useEffect(() => {
    markedSeen.current = false;
    setInitialLoading(true);

    // Join socket room
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
     SCROLL TO BOTTOM on new messages
  ───────────────────────────────────────────── */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || initialLoading) return;
    // Only auto-scroll if near bottom
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distFromBottom < 200) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages.length, initialLoading]);

  /* First load scroll to bottom */
  useEffect(() => {
    if (!initialLoading && messages.length > 0) {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [initialLoading]);

  /* ─────────────────────────────────────────────
     MARK AS SEEN when chat window is focused
  ───────────────────────────────────────────── */
  useEffect(() => {
    if (messages.length > 0 && !markedSeen.current) {
      markedSeen.current = true;
      emitMarkAsSeen(conversationId).catch(console.error);
      clearUnread(conversationId);
    }
  }, [messages.length, conversationId, clearUnread]);

  /* ─────────────────────────────────────────────
     INFINITE SCROLL  — load older messages on scroll to top
  ───────────────────────────────────────────── */
  const handleScroll = useCallback(async () => {
    const el = scrollRef.current;
    if (!el || loadingMore || !pagination?.hasNextPage) return;

    if (el.scrollTop < 60) {
      prevScrollHeight.current = el.scrollHeight;
      setLoadingMore(conversationId, true);
      try {
        const nextPage = (pagination.page ?? 1) + 1;
        const { messages: older, pagination: newPag } = await getMessages(conversationId, nextPage, 20);
        prependMessages(conversationId, older, newPag);
        // Restore scroll position after prepend
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
        }
      } catch (err) {
        console.error("Failed to send message", err);
      }
    },
    [user, conversationId, appendMessage, updateLastMessage, replaceTempMessage]
  );

  /* ─────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────── */
  if (errorStatus) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-900/40 gap-4">
        <AlertTriangle className="w-12 h-12 text-red-500/80" />
        <h3 className="text-xl font-semibold text-slate-200">
          {errorStatus === 403 || errorStatus === 401 ? "Access Denied" : "Conversation Not Found"}
        </h3>
        <p className="text-slate-400 text-sm max-w-sm text-center">
          You don't have permission to view this conversation or it doesn't exist.
        </p>
        <button
          onClick={onBack}
          className="mt-2 px-6 py-2 rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700 transition"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Show a loading frame if local conversation hasn't hydrated yet but we are loading
  if (!conversation && !errorStatus) {
    return (
      <div className="flex flex-col h-full bg-slate-900/40 items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!conversation) return null;

  const grouped = groupByDate(messages);

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-900 to-slate-950">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800 backdrop-blur-md z-10 w-full">
        {onBack && (
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        {participant?.avatar ? (
          <img
            src={participant.avatar}
            alt={participant.name}
            className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-600"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold ring-2 ring-slate-600">
            {participant?.name?.[0]?.toUpperCase() ?? "?"}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-slate-100 truncate">{participant?.name}</p>
          <p className="text-xs text-slate-400 truncate">@{participant?.username}</p>
        </div>
      </div>

      {/* ── Centered Chat Content (Messages + Input) ── */}
      <div className="flex-1 flex justify-center overflow-hidden">
        <div className="w-full max-w-3xl px-4 flex flex-col h-full relative">
          
          {/* ── Messages area ── */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto pt-6 space-y-0 scrollbar-thin scrollbar-thumb-slate-700"
          >
        {/* Load more spinner */}
        {loadingMore && (
          <div className="flex justify-center py-3">
            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
          </div>
        )}

        {/* Initial skeleton */}
        {initialLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={cn("flex", i % 2 === 0 ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "h-10 rounded-2xl bg-slate-700/60 animate-pulse",
                    i % 2 === 0 ? "w-48 rounded-br-md" : "w-36 rounded-bl-md"
                  )}
                />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-16">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600/20 to-indigo-600/20 flex items-center justify-center">
              <div className="text-2xl">💬</div>
            </div>
            <p className="text-slate-400 text-sm">
              No messages yet. Say hi to{" "}
              <span className="text-blue-400 font-medium">{participant?.name}</span>!
            </p>
          </div>
        ) : (
          grouped.map((group, gi) => (
            <div key={gi}>
              <DateSeparator date={group.date} />
              {group.messages.map((msg) => {
                const senderId =
                  typeof msg.senderId === "object" ? msg.senderId._id : msg.senderId;
                return (
                  <MessageBubble
                    key={msg._id}
                    message={msg}
                    isOwn={senderId === user?._id}
                  />
                );
              })}
            </div>
          ))
        )}

        {/* Typing indicator */}
        {typingUsers.length > 0 && <TypingIndicator />}
          </div>

          {/* ── Input ── */}
          <div className="pb-4 pt-2 bg-transparent z-10">
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
