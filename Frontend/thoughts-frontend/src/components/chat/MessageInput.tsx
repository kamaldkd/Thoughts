import { useRef, useState, useCallback, useEffect } from "react";
import { Send, Loader2, Reply, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { emitTyping } from "@/services/socket";
import type { Message } from "@/services/chatApi";

interface MessageInputProps {
  conversationId: string;
  onSend: (content: string) => void;
  replyTo?: Message | null;
  onCancelReply?: () => void;
  disabled?: boolean;
}

const MAX_CHARS = 2000;
const CHAR_WARN_THRESHOLD = 1800;
const TYPING_DEBOUNCE_MS = 1000;

export const MessageInput = ({
  conversationId,
  onSend,
  replyTo,
  onCancelReply,
  disabled,
}: MessageInputProps) => {
  const [value, setValue] = useState("");
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (replyTo) textareaRef.current?.focus();
  }, [replyTo]);

  const charCount = value.length;
  const showCounter = charCount > CHAR_WARN_THRESHOLD;
  const isOverLimit = charCount > MAX_CHARS;

  // Auto-resize textarea
  const resize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  };

  const stopTyping = useCallback(() => {
    if (isTypingRef.current) {
      isTypingRef.current = false;
      emitTyping(conversationId, false);
    }
  }, [conversationId]);

  const startTyping = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      emitTyping(conversationId, true);
    }
    // Reset debounce timer
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(stopTyping, TYPING_DEBOUNCE_MS);
  }, [conversationId, stopTyping]);

  // Cleanup on unmount or conversation change
  useEffect(() => {
    return () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
      stopTyping();
    };
  }, [conversationId, stopTyping]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    resize();
    if (e.target.value.trim()) startTyping();
    else stopTyping();
  };

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled || isOverLimit) return;
    stopTyping();
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    onSend(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = value.trim().length > 0 && !disabled && !isOverLimit;

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card px-3 py-2.5 shadow-sm",
        "transition-colors focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10"
      )}
    >
      {replyTo && (
        <div className="mb-2 flex items-center gap-2 rounded-lg border-l-2 border-primary bg-secondary/60 px-2.5 py-1.5">
          <Reply className="h-4 w-4 flex-shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-primary">
              Replying to{" "}
              {typeof replyTo.senderId === "object"
                ? replyTo.senderId.name || replyTo.senderId.username
                : "message"}
            </p>
            <p className="truncate text-xs text-muted-foreground">{replyTo.content}</p>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            aria-label="Cancel reply"
            className="rounded-full p-1 text-muted-foreground hover:bg-background hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2.5">
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            rows={1}
            disabled={disabled}
            className={cn(
              "w-full resize-none bg-transparent px-1 py-1 text-[13.5px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground",
              "max-h-[140px] scrollbar-thin",
              disabled && "cursor-not-allowed opacity-50"
            )}
          />

          {showCounter && (
            <div
              className={cn(
                "absolute -top-5 right-0 text-[10px] font-medium tabular-nums transition-colors",
                isOverLimit ? "text-destructive" : "text-muted-foreground"
              )}
            >
              {charCount}/{MAX_CHARS}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          aria-label="Send message"
          className={cn(
            "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition-all duration-200",
            canSend
              ? "bg-primary text-primary-foreground shadow-sm hover:opacity-90 active:scale-95"
              : "cursor-not-allowed bg-muted text-muted-foreground"
          )}
        >
          {disabled && value.trim() ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="ml-0.5 h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  );
};
