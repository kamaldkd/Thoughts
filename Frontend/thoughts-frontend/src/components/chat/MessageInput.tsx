import { useRef, useState, useCallback, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { emitTyping } from "@/services/socket";

interface MessageInputProps {
  conversationId: string;
  onSend: (content: string) => void;
  disabled?: boolean;
}

const MAX_CHARS = 2000;
const CHAR_WARN_THRESHOLD = 1800;
const TYPING_DEBOUNCE_MS = 1000;

export const MessageInput = ({ conversationId, onSend, disabled }: MessageInputProps) => {
  const [value, setValue] = useState("");
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
        "flex items-end gap-2.5 px-3 py-2.5",
        "bg-slate-900/60 backdrop-blur-md",
        "border border-slate-700/40 rounded-2xl",
        "transition-all duration-200",
        "focus-within:border-blue-500/30 focus-within:bg-slate-900/80"
      )}
    >
      {/* Input */}
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
          rows={1}
          disabled={disabled}
          className={cn(
            "w-full resize-none bg-transparent text-slate-100 placeholder-slate-500",
            "px-1 py-1 text-[13.5px] outline-none",
            "max-h-[140px] leading-relaxed",
            "scrollbar-thin scrollbar-thumb-slate-600",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />

        {/* Character counter */}
        {showCounter && (
          <div
            className={cn(
              "absolute -top-5 right-0 text-[10px] font-medium tabular-nums transition-colors",
              isOverLimit ? "text-red-400" : "text-slate-500"
            )}
          >
            {charCount}/{MAX_CHARS}
          </div>
        )}
      </div>

      {/* Send button */}
      <button
        onClick={handleSend}
        disabled={!canSend}
        className={cn(
          "flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center",
          "transition-all duration-200",
          canSend
            ? cn(
                "bg-gradient-to-br from-blue-500 to-indigo-600 text-white",
                "shadow-lg shadow-blue-600/20",
                "hover:brightness-110 hover:shadow-blue-600/30",
                "hover:scale-105 active:scale-95"
              )
            : "bg-slate-800 text-slate-600 cursor-not-allowed"
        )}
      >
        {disabled && value.trim() ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-3.5 h-3.5 ml-0.5" />
        )}
      </button>
    </div>
  );
};
