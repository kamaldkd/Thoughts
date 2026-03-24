import { useRef, useState, useCallback, useEffect } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { emitTyping } from "@/services/socket";

interface MessageInputProps {
  conversationId: string;
  onSend: (content: string) => void;
  disabled?: boolean;
}

const TYPING_DEBOUNCE_MS = 1000;

export const MessageInput = ({ conversationId, onSend, disabled }: MessageInputProps) => {
  const [value, setValue] = useState("");
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    if (!trimmed || disabled) return;
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

  return (
    <div className="flex items-end gap-3 px-1 py-2">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Type a message…"
        rows={1}
        disabled={disabled}
        className={cn(
          "flex-1 resize-none bg-slate-700/60 text-slate-100 placeholder-slate-500",
          "rounded-2xl px-4 py-3 text-sm outline-none border border-transparent",
          "focus:border-blue-500/50 focus:ring-0 transition-all duration-200",
          "scrollbar-thin scrollbar-thumb-slate-600 max-h-[140px] leading-relaxed",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      />
      <button
        onClick={handleSend}
        disabled={!value.trim() || disabled}
        className={cn(
          "flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center",
          "bg-gradient-to-br from-blue-600 to-indigo-600 text-white",
          "transition-all duration-200 shadow-lg shadow-blue-500/20",
          "hover:brightness-110 hover:scale-105 active:scale-95",
          (!value.trim() || disabled) && "opacity-40 cursor-not-allowed hover:scale-100"
        )}
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  );
};
