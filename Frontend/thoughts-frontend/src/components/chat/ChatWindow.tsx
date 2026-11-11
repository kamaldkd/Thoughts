import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import { useChatStore } from "@/store/useChatStore";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { TypingIndicator } from "./TypingIndicator";
import { joinConversation, leaveConversation, emitSendMessage, emitMarkAsSeen } from "@/services/socket";
import { getMessageSenderId, getMessages } from "@/services/chatApi";
import { useAuth } from "@/hooks/useAuth";
import { ParticipantAvatar } from "./ParticipantAvatar";
import { Link } from "react-router-dom";
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
      <span className="rounded-full border border-border/70 bg-card px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
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
              "animate-pulse rounded-2xl bg-muted",
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
        "flex h-10 w-10 items-center justify-center rounded-full",
        "border border-border bg-card/95 shadow-md backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900",
        "transition-all duration-200 hover:bg-secondary hover:scale-105 active:scale-95",
        "animate-bounce-in-fab"
      )}
    >
      <ChevronDown className="h-5 w-5 text-foreground" />
      {unreadBelow > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-sm">
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
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-background px-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/10">
          <AlertTriangle className="h-8 w-8 text-destructive/80" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">
          {errorStatus === 403 || errorStatus === 401 ? "Access Denied" : "Conversation Not Found"}
        </h3>
        <p className="max-w-sm text-center text-sm text-muted-foreground">
          You don't have permission to view this conversation or it doesn't exist.
        </p>
        <button
          onClick={onBack}
          className="mt-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!conversation && !errorStatus) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!conversation) return null;

  return (
    <div className="flex h-full w-full min-w-0 flex-col bg-white dark:bg-black">
      {/* ── Header ── */}
      <div className="z-10 flex w-full items-center gap-3 border-b border-border/60 bg-white/95 px-4 py-3 backdrop-blur-md dark:border-neutral-800 dark:bg-black/95">
        {onBack && (
          <button
            onClick={onBack}
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground md:hidden"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        {participant?.username ? (
          <Link
            to={`/profile/${encodeURIComponent(participant.username)}`}
            aria-label={`View ${participant.name}'s profile`}
            className="flex-shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <ParticipantAvatar
              src={participant.avatar}
              name={participant.name || participant.username}
              className="h-10 w-10"
            />
          </Link>
        ) : (
          <ParticipantAvatar
            src={participant?.avatar}
            name={participant?.name || participant?.username || "?"}
            className="h-10 w-10"
          />
        )}
        <div className="flex-1 min-w-0">
          {participant?.username ? (
            <Link
              to={`/profile/${encodeURIComponent(participant.username)}`}
              className="block w-fit max-w-full truncate text-sm font-semibold text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {participant.name}
            </Link>
          ) : (
            <p className="truncate text-sm font-semibold text-foreground">{participant?.name}</p>
          )}
          {typingUsers.length > 0 ? (
            <p className="animate-fade-in truncate text-xs font-medium text-primary">typing…</p>
          ) : (
            <p className="truncate text-xs text-muted-foreground">@{participant?.username}</p>
          )}
        </div>
      </div>

      {/* ── Chat Content ── */}
      <div className="relative flex flex-1 justify-center overflow-hidden">
        <div className="relative flex h-full w-full max-w-3xl flex-col px-3 sm:px-5">

          {/* ── Messages area ── */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="chat-scrollbar flex-1 overflow-y-auto px-1 pb-2 pt-4"
          >
            {/* Load more spinner */}
            {loadingMore && (
              <div className="flex justify-center py-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            )}

            {initialLoading ? (
              <MessageSkeleton />
            ) : messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/10 bg-primary/5">
                  <span className="text-2xl text-primary">✦</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    No messages yet
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Say hi to{" "}
                    <span className="font-medium text-primary">{participant?.name}</span>!
                  </p>
                </div>
              </div>
            ) : (
              grouped.map((group, gi) => (
                <div key={gi}>
                  <DateSeparator date={group.date} />
                  {group.messages.map((msg) => {
                    const senderId = getMessageSenderId(msg.senderId);
                    const isOwn =
                      senderId !== "" && senderId === getMessageSenderId(user?._id);
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
          <div className="border-t border-border/50 bg-white pb-3 pt-3 dark:border-neutral-800 dark:bg-black">
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
