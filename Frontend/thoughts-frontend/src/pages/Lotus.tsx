import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import { useNavigate } from "react-router-dom";
import remarkGfm from "remark-gfm";
import {
  ArrowLeft,
  ArrowUp,
  LoaderCircle,
  RotateCcw,
} from "lucide-react";
import { sendLotusMessage, type LotusMessage } from "@/lib/api";
import { LotusBloom, LotusMark } from "@/components/lotus/LotusBloom";

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="mb-3 mt-5 font-serif text-xl font-semibold text-white first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-2 mt-4 font-serif text-lg font-semibold text-white first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-4 text-base font-semibold text-white first:mt-0">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="mb-3 leading-7 last:mb-0">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-white">{children}</strong>
  ),
  em: ({ children }) => <em className="text-fuchsia-200">{children}</em>,
  ul: ({ children }) => (
    <ul className="mb-3 ml-5 list-disc space-y-1.5 marker:text-fuchsia-300 last:mb-0">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-3 ml-5 list-decimal space-y-1.5 marker:font-medium marker:text-fuchsia-300 last:mb-0">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-1 leading-7">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-4 border-l-2 border-fuchsia-400/50 pl-4 text-zinc-400">
      {children}
    </blockquote>
  ),
  pre: ({ children }) => (
    <pre className="my-4 max-w-full overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-slate-100 shadow-inner">
      {children}
    </pre>
  ),
  code: ({ children, className }) => (
    <code
      className={
        className
          ? `${className} font-mono`
          : "rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-[0.9em] text-fuchsia-200"
      }
    >
      {children}
    </code>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="font-medium text-fuchsia-200 underline decoration-fuchsia-300/30 underline-offset-4 hover:decoration-fuchsia-200"
    >
      {children}
    </a>
  ),
  hr: () => <hr className="my-5 border-white/10" />,
};

const suggestions = [
  "Brainstorm ideas",
  "Polish my writing",
  "Fresh perspective",
];

export default function Lotus() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<LotusMessage[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function sendMessage(event?: FormEvent) {
    event?.preventDefault();
    const content = input.trim();
    if (!content || sending) return;

    const conversation = [...messages, { role: "user" as const, content }];
    setMessages([...conversation, { role: "assistant", content: "" }]);
    setInput("");
    setError("");
    setSending(true);

    let streamedReply = "";
    try {
      const response = await sendLotusMessage(
        conversation.slice(-12),
        (delta) => {
          streamedReply += delta;
          setMessages([
            ...conversation,
            { role: "assistant", content: streamedReply },
          ]);
        }
      );
      setMessages([
        ...conversation,
        { role: "assistant", content: response.data.reply },
      ]);
    } catch (err: unknown) {
      let message: string | undefined;
      if (axios.isAxiosError(err)) {
        const data: unknown = err.response?.data;
        if (typeof data === "string") {
          try {
            const parsed: unknown = JSON.parse(data);
            if (
              parsed &&
              typeof parsed === "object" &&
              "message" in parsed &&
              typeof parsed.message === "string"
            ) {
              message = parsed.message;
            }
          } catch {
            message = undefined;
          }
        } else if (
          data &&
          typeof data === "object" &&
          "message" in data &&
          typeof data.message === "string"
        ) {
          message = data.message;
        }
      } else if (err instanceof Error) {
        message = err.message;
      }
      if (!streamedReply) setMessages(conversation);
      setError(message || "Lotus could not respond. Please try again.");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  }

  function startWithSuggestion(suggestion: string) {
    setInput(suggestion);
    setError("");
  }

  const lastMessage = messages[messages.length - 1];
  const waitingForFirstToken =
    sending &&
    (!lastMessage || lastMessage.role !== "assistant" || !lastMessage.content);

  return (
    <main className="relative mx-auto flex h-[100dvh] w-full flex-col overflow-hidden bg-[#08070b] px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-[max(env(safe-area-inset-top),12px)] text-zinc-100 sm:px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-32 top-16 h-72 w-72 rounded-full bg-fuchsia-600/15 blur-3xl" />
        <div className="absolute -right-32 top-1/3 h-80 w-80 rounded-full bg-violet-600/15 blur-3xl" />
      </div>

      <header className="relative mx-auto flex h-12 w-full max-w-3xl shrink-0 items-center justify-center">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="absolute left-0 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-zinc-200 transition-colors hover:bg-white/10 active:scale-95"
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </button>
        <h1 className="text-sm font-medium tracking-wide text-zinc-100">
          Lotus
        </h1>
      </header>

      <section
        className="chat-scrollbar relative mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col overflow-y-auto px-1 py-4 sm:px-3"
        aria-label="Conversation with Lotus"
        aria-live="polite"
      >
        {messages.length > 0 && (
          <div className="mb-5 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setMessages([]);
                setError("");
              }}
              disabled={sending}
              aria-label="Clear conversation"
              title="Clear conversation"
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-zinc-200 disabled:opacity-40"
            >
              <RotateCcw size={13} aria-hidden="true" />
              New chat
            </button>
          </div>
        )}
        {messages.length === 0 ? (
          <div className="flex min-h-full flex-col items-center justify-center py-2 text-center">
            <div className="mb-1">
              <LotusBloom />
            </div>
            <h2 className="font-serif text-3xl font-medium tracking-tight text-white">
              Hello, I’m Lotus.
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-400">
              What would you like to explore today?
            </p>
            <div className="mt-4 flex max-w-lg flex-wrap justify-center gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => startWithSuggestion(suggestion)}
                  className="shrink-0 whitespace-nowrap rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs text-zinc-300 transition-all hover:border-fuchsia-300/30 hover:bg-fuchsia-300/[0.08] hover:text-white"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
            {messages.map((message, index) =>
              message.role === "user" ? (
                <div
                  key={`user-${index}`}
                  className="flex justify-end animate-fade-msg"
                >
                  <p className="max-w-[88%] whitespace-pre-wrap break-words rounded-[22px] rounded-br-md border border-fuchsia-300/15 bg-gradient-to-br from-violet-600/90 to-fuchsia-600/90 px-4 py-3 text-sm leading-6 text-white shadow-lg shadow-black/20 sm:max-w-[78%] sm:px-5">
                    {message.content}
                  </p>
                </div>
              ) : (
                message.content && (
                  <article
                    key={`lotus-${index}`}
                    className="flex items-start gap-3 animate-fade-msg"
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-fuchsia-300/15 bg-gradient-to-br from-fuchsia-400/15 to-violet-400/15 text-fuchsia-200">
                      <LotusMark className="h-[18px] w-[18px]" />
                    </div>
                    <div className="min-w-0 flex-1 pt-1 text-sm text-zinc-300">
                      <p className="mb-1.5 text-xs font-semibold text-fuchsia-200">
                        Lotus
                      </p>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={markdownComponents}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  </article>
                )
              )
            )}
            {waitingForFirstToken && (
              <div className="flex items-center gap-3 text-sm text-zinc-400">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-fuchsia-300/15 bg-fuchsia-400/10 text-fuchsia-200">
                  <LotusMark className="h-[18px] w-[18px]" />
                </div>
                <span className="inline-flex items-center gap-2">
                  Lotus is thinking
                  <LoaderCircle
                    className="animate-spin text-fuchsia-300"
                    size={14}
                    aria-hidden="true"
                  />
                </span>
              </div>
            )}
            {error && (
              <p
                role="alert"
                className="ml-11 rounded-xl border border-rose-400/20 bg-rose-400/[0.08] px-3 py-2 text-sm text-rose-200"
              >
                {error}
              </p>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </section>

      {messages.length === 0 && error && (
        <p role="alert" className="relative mt-2 text-center text-sm text-rose-200">
          {error}
        </p>
      )}

      <form
        onSubmit={sendMessage}
        className="relative mx-auto mt-3 w-full max-w-3xl rounded-full border border-white/[0.12] bg-[#17151b]/95 p-1.5 shadow-[0_10px_35px_-18px_rgba(0,0,0,0.9)] backdrop-blur-xl transition-colors focus-within:border-fuchsia-300/30"
      >
        <div className="flex items-end gap-2 pl-3">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Lotus anything..."
            aria-label="Message Lotus"
            maxLength={2000}
            rows={1}
            className="max-h-32 min-h-11 flex-1 resize-none bg-transparent py-3 text-sm leading-5 text-zinc-100 outline-none placeholder:text-zinc-500"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            aria-label="Send message"
            className="mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-md shadow-fuchsia-950/30 transition-all hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {sending ? (
              <LoaderCircle className="animate-spin" size={17} aria-hidden="true" />
            ) : (
              <ArrowUp size={18} strokeWidth={2.2} aria-hidden="true" />
            )}
          </button>
        </div>
      </form>
    </main>
  );
}
