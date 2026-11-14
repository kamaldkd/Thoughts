import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import remarkGfm from "remark-gfm";
import {
  ArrowLeft,
  ArrowUp,
  Check,
  Copy,
  LoaderCircle,
  MessageSquarePlus,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  RotateCcw,
  Square,
} from "lucide-react";
import {
  createLotusConversation,
  deleteLotusConversation,
  getLotusConversations,
  getLotusMessages,
  getLotusMode,
  regenerateLotusMessage,
  renameLotusConversation,
  sendLotusMessage,
  setLotusMode,
  type LotusConversation,
  type LotusMessage,
  type LotusMode,
  type LotusThoughtAction,
} from "@/lib/api";
import { LotusBloom, LotusMark } from "@/components/lotus/LotusBloom";
import LotusCreativeStudio from "@/components/lotus/LotusCreativeStudio";
import LotusHistoryPanel from "@/components/lotus/LotusHistoryPanel";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  p: ({ children }) => <p className="mb-3 leading-7 last:mb-0">{children}</p>,
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

const openingSuggestions = [
  "Help me brainstorm an idea",
  "Polish a piece of writing",
  "Give me a fresh perspective",
];
const thoughtActionPrompts: Record<LotusThoughtAction, string> = {
  ask: "",
  explain: "Explain this post.",
  comment: "Suggest a thoughtful comment for this post.",
  reply: "Generate a thoughtful reply to this post.",
  summarize: "Summarize the discussion on this post.",
};

type LotusLocationState = {
  thoughtId?: string;
  thoughtAction?: LotusThoughtAction;
};
const isLotusMode = (value: string): value is LotusMode =>
  value === "friendly" || value === "professional" || value === "creative";

const followUpSuggestions = [
  "Can you explain that in more detail?",
  "Can you give me a practical example?",
  "What should I consider next?",
];

const errorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const data: unknown = error.response?.data;
    if (
      data &&
      typeof data === "object" &&
      "message" in data &&
      typeof data.message === "string"
    ) {
      return data.message;
    }
  }
  return error instanceof Error ? error.message : "Lotus could not respond. Please try again.";
};

export default function Lotus() {
  const navigate = useNavigate();
  const location = useLocation();
  const { conversationId } = useParams<{ conversationId?: string }>();
  const [conversations, setConversations] = useState<LotusConversation[]>([]);
  const [messages, setMessages] = useState<LotusMessage[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [mode, setMode] = useState<LotusMode>("friendly");
  const [modeSaving, setModeSaving] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const [studioOpen, setStudioOpen] = useState(false);
  const [pendingThoughtContext, setPendingThoughtContext] = useState<{
    thoughtId: string;
    thoughtAction: LotusThoughtAction;
  } | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const activeRequestRef = useRef<AbortController | null>(null);
  const skipConversationLoadRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([getLotusConversations(), getLotusMode()])
      .then(([conversationList, selectedMode]) => {
        if (!active) return;
        setConversations(conversationList);
        setMode(selectedMode);
      })
      .catch((loadError: unknown) => {
        if (active) setError(errorMessage(loadError));
      });
    return () => {
      active = false;
      activeRequestRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const state = location.state as LotusLocationState | null;
    if (!state?.thoughtId || !state.thoughtAction) return;
    setPendingThoughtContext({
      thoughtId: state.thoughtId,
      thoughtAction: state.thoughtAction,
    });
    setInput(thoughtActionPrompts[state.thoughtAction]);
    setStudioOpen(false);
    setError("");
  }, [location.key, location.state]);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setHistoryLoading(false);
      return;
    }
    if (skipConversationLoadRef.current === conversationId) {
      skipConversationLoadRef.current = null;
      setHistoryLoading(false);
      return;
    }
    let active = true;
    setMessages([]);
    setHistoryLoading(true);
    setError("");
    getLotusMessages(conversationId)
      .then((loadedMessages) => {
        if (active) setMessages(loadedMessages);
      })
      .catch((loadError: unknown) => {
        if (active) setError(errorMessage(loadError));
      })
      .finally(() => {
        if (active) setHistoryLoading(false);
      });
    return () => {
      active = false;
    };
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const startNewChat = useCallback(() => {
    activeRequestRef.current?.abort();
    activeRequestRef.current = null;
    setSending(false);
    setMessages([]);
    setInput("");
    setError("");
    setPendingThoughtContext(null);
    setStudioOpen(false);
    setMobileHistoryOpen(false);
    navigate("/lotus");
  }, [navigate]);

  const selectConversation = useCallback(
    (id: string) => {
      activeRequestRef.current?.abort();
      activeRequestRef.current = null;
      setSending(false);
      setError("");
      setPendingThoughtContext(null);
      setStudioOpen(false);
      setMobileHistoryOpen(false);
      navigate(`/lotus/${id}`);
    },
    [navigate]
  );

  const handleRename = async (conversation: LotusConversation) => {
    const title = window.prompt("Rename conversation", conversation.title)?.trim();
    if (!title || title === conversation.title) return;
    try {
      const updated = await renameLotusConversation(conversation._id, title);
      setConversations((items) =>
        items.map((item) => (item._id === updated._id ? updated : item))
      );
    } catch (renameError) {
      setError(errorMessage(renameError));
    }
  };

  const handleDelete = async (conversation: LotusConversation) => {
    if (!window.confirm(`Delete “${conversation.title}”? This cannot be undone.`)) return;
    try {
      await deleteLotusConversation(conversation._id);
      setConversations((items) => items.filter((item) => item._id !== conversation._id));
      if (conversation._id === conversationId) startNewChat();
    } catch (deleteError) {
      setError(errorMessage(deleteError));
    }
  };

  const changeMode = async (nextMode: LotusMode) => {
    const previousMode = mode;
    setMode(nextMode);
    setModeSaving(true);
    try {
      await setLotusMode(nextMode);
    } catch (modeError) {
      setMode(previousMode);
      setError(errorMessage(modeError));
    } finally {
      setModeSaving(false);
    }
  };

  async function sendMessage(
    event?: FormEvent,
    overrideContent?: string,
    thoughtContext?: { thoughtId: string; thoughtAction: LotusThoughtAction }
  ) {
    event?.preventDefault();
    const content = (overrideContent ?? input).trim();
    if (!content || sending) return;
    const contextForMessage = thoughtContext || pendingThoughtContext;

    const clientMessageId = crypto.randomUUID();
    const assistantLocalId = `assistant-${clientMessageId}`;
    const userMessage: LotusMessage = {
      _id: clientMessageId,
      role: "user",
      content,
      status: "pending",
      thoughtId: thoughtContext?.thoughtId || null,
      thoughtAction: thoughtContext?.thoughtAction || null,
    };
    setMessages((items) => [
      ...items,
      userMessage,
      {
        _id: assistantLocalId,
        role: "assistant",
        content: "",
        status: "pending",
      },
    ]);
    setInput("");
    setError("");
    setSending(true);

    const controller = new AbortController();
    activeRequestRef.current = controller;
    let targetConversationId = conversationId;
    let streamedReply = "";

    try {
      if (!targetConversationId) {
        const created = await createLotusConversation();
        targetConversationId = created._id;
        setConversations((items) => [created, ...items]);
        skipConversationLoadRef.current = created._id;
        navigate(`/lotus/${created._id}`, { replace: true });
      }

      const result = await sendLotusMessage(
        targetConversationId,
        content,
        clientMessageId,
        (delta) => {
          streamedReply += delta;
          setMessages((items) =>
            items.map((message) =>
              message._id === assistantLocalId
                ? { ...message, content: streamedReply }
                : message
            )
          );
        },
        controller.signal,
        contextForMessage || undefined
      );
      setMessages((items) =>
        items.map((message) => {
          if (message._id === clientMessageId) {
            return {
              ...message,
              _id: result.userMessageId || message._id,
              status: "complete",
            };
          }
          if (message._id === assistantLocalId) {
            return {
              ...message,
              _id: result.messageId || message._id,
              content: result.reply,
              status: "complete",
            };
          }
          return message;
        })
      );
      if (targetConversationId) {
        setConversations((items) =>
          items
            .map((item) =>
              item._id === targetConversationId
                ? {
                    ...item,
                    ...(result.title ? { title: result.title } : {}),
                    updatedAt: result.updatedAt || new Date().toISOString(),
                  }
                : item
            )
            .sort(
              (left, right) =>
                new Date(right.updatedAt).getTime() -
                new Date(left.updatedAt).getTime()
            )
        );
      }
    } catch (sendError: unknown) {
      if (controller.signal.aborted) {
        setMessages((items) =>
          items.map((message) =>
            message._id === assistantLocalId
              ? { ...message, content: streamedReply, status: "stopped" }
              : message._id === clientMessageId
                ? { ...message, status: "stopped" }
                : message
          )
        );
      } else {
        setMessages((items) =>
          items.filter(
            (message) => message._id !== assistantLocalId || Boolean(message.content)
          )
        );
        setError(errorMessage(sendError));
      }
    } finally {
      if (activeRequestRef.current === controller) {
        activeRequestRef.current = null;
        setSending(false);
      }
    }
  }

  async function regenerateLastReply() {
    if (!conversationId || sending || !messages.length) return;
    const lastAssistant = messages[messages.length - 1];
    const previousUser = [...messages]
      .slice(0, -1)
      .reverse()
      .find((message) => message.role === "user");
    if (
      lastAssistant.role !== "assistant" ||
      !lastAssistant._id ||
      !previousUser?._id
    ) {
      return;
    }

    const controller = new AbortController();
    activeRequestRef.current = controller;
    setSending(true);
    setError("");
    setMessages((items) =>
      items.map((message) =>
        message === lastAssistant
          ? { ...message, content: "", status: "pending" }
          : message
      )
    );
    let streamedReply = "";
    try {
      const result = await regenerateLotusMessage(
        conversationId,
        previousUser._id,
        (delta) => {
          streamedReply += delta;
          setMessages((items) =>
            items.map((message) =>
              message._id === lastAssistant._id
                ? { ...message, content: streamedReply }
                : message
            )
          );
        },
        controller.signal
      );
      setMessages((items) =>
        items.map((message) =>
          message._id === lastAssistant._id
            ? {
                ...message,
                _id: result.messageId || message._id,
                content: result.reply,
                status: "complete",
              }
            : message
        )
      );
    } catch (regenerateError: unknown) {
      if (controller.signal.aborted) {
        setMessages((items) =>
          items.map((message) =>
            message._id === lastAssistant._id
              ? { ...message, content: streamedReply, status: "stopped" }
              : message
          )
        );
      } else {
        setError(errorMessage(regenerateError));
        setMessages((items) =>
          items.map((message) =>
            message._id === lastAssistant._id
              ? { ...message, content: streamedReply, status: "failed" }
              : message
          )
        );
      }
    } finally {
      if (activeRequestRef.current === controller) {
        activeRequestRef.current = null;
        setSending(false);
      }
    }
  }

  function stopGenerating() {
    activeRequestRef.current?.abort();
  }

  async function copyMessage(message: LotusMessage) {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopiedMessageId(message._id || "");
      window.setTimeout(() => setCopiedMessageId(""), 1500);
    } catch {
      setError("Could not copy this response. Please select and copy it manually.");
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  }

  const currentConversation =
    conversations.find((item) => item._id === conversationId) || null;
  const lastMessage = messages[messages.length - 1];
  const waitingForFirstToken =
    sending &&
    (!lastMessage || lastMessage.role !== "assistant" || !lastMessage.content);
  const historyProps = {
    conversations,
    activeConversationId: conversationId,
    onNewChat: startNewChat,
    onOpenStudio: () => {
      setStudioOpen(true);
      setMobileHistoryOpen(false);
    },
    onSelect: selectConversation,
    onRename: handleRename,
    onDelete: handleDelete,
  };

  return (
    <main className="relative flex h-[100dvh] w-full overflow-hidden bg-[#08070b] text-zinc-100">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-32 top-16 h-72 w-72 rounded-full bg-fuchsia-600/10 blur-3xl" />
        <div className="absolute -right-32 top-1/3 h-80 w-80 rounded-full bg-violet-600/10 blur-3xl" />
      </div>

      {showSidebar && (
        <aside className="relative z-10 hidden h-full w-[276px] shrink-0 border-r border-white/[0.07] bg-[#0c0a10]/90 p-4 backdrop-blur-xl md:flex md:flex-col">
          <LotusHistoryPanel {...historyProps} />
        </aside>
      )}
      <Sheet open={mobileHistoryOpen} onOpenChange={setMobileHistoryOpen}>
        <SheetContent
          side="left"
          className="w-[min(86vw,340px)] border-white/10 bg-[#0c0a10] p-4 text-zinc-100 sm:max-w-[340px]"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Lotus conversations</SheetTitle>
            <SheetDescription>Browse, rename, or delete your conversations.</SheetDescription>
          </SheetHeader>
          <LotusHistoryPanel {...historyProps} />
        </SheetContent>
      </Sheet>

      <section className="relative z-0 flex min-w-0 flex-1 flex-col">
        <header className="mx-auto flex h-14 w-full max-w-5xl shrink-0 items-center gap-2 border-b border-white/[0.05] px-3 sm:px-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-400 transition hover:bg-white/[0.07] hover:text-white"
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setMobileHistoryOpen(true)}
            aria-label="Open conversation history"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-400 transition hover:bg-white/[0.07] hover:text-white md:hidden"
          >
            <Menu size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setShowSidebar((visible) => !visible)}
            aria-label={showSidebar ? "Hide conversation sidebar" : "Show conversation sidebar"}
            className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-400 transition hover:bg-white/[0.07] hover:text-white md:flex"
          >
            {showSidebar ? (
              <PanelLeftClose size={17} aria-hidden="true" />
            ) : (
              <PanelLeftOpen size={17} aria-hidden="true" />
            )}
          </button>

          <div className="flex min-w-0 flex-1 items-center gap-2">
            <LotusMark className="h-[18px] w-[18px] shrink-0 text-fuchsia-200" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-100">Lotus</p>
              <p className="truncate text-[10px] text-zinc-500">
                {studioOpen
                  ? "Creative Studio"
                  : currentConversation?.title || "A thoughtful companion"}
              </p>
            </div>
          </div>

          <label className="sr-only" htmlFor="lotus-mode">
            Lotus response style
          </label>
          <Select
            value={mode}
            onValueChange={(value) => {
              if (isLotusMode(value)) void changeMode(value);
            }}
          >
            <SelectTrigger
              id="lotus-mode"
              disabled={modeSaving}
              aria-label="Lotus response style"
              className="h-9 w-[126px] rounded-full border-fuchsia-300/15 bg-[#15111b]/90 px-3 text-xs text-zinc-100 shadow-none transition hover:border-fuchsia-300/35 focus:ring-1 focus:ring-fuchsia-300/25 focus:ring-offset-0 disabled:opacity-50 sm:w-[142px]"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              align="end"
              className="min-w-[160px] rounded-2xl border-fuchsia-300/20 bg-[#17121f]/95 p-1.5 text-zinc-100 shadow-[0_14px_45px_-16px_rgba(0,0,0,0.9)] backdrop-blur-xl"
            >
              <SelectItem
                value="friendly"
                className="rounded-xl py-2 pl-8 text-xs text-zinc-300 focus:bg-fuchsia-300/10 focus:text-fuchsia-100 data-[highlighted]:bg-fuchsia-300/10 data-[highlighted]:text-fuchsia-100 data-[state=checked]:text-fuchsia-100"
              >
                Friendly
              </SelectItem>
              <SelectItem
                value="professional"
                className="rounded-xl py-2 pl-8 text-xs text-zinc-300 focus:bg-fuchsia-300/10 focus:text-fuchsia-100 data-[highlighted]:bg-fuchsia-300/10 data-[highlighted]:text-fuchsia-100 data-[state=checked]:text-fuchsia-100"
              >
                Professional
              </SelectItem>
              <SelectItem
                value="creative"
                className="rounded-xl py-2 pl-8 text-xs text-zinc-300 focus:bg-fuchsia-300/10 focus:text-fuchsia-100 data-[highlighted]:bg-fuchsia-300/10 data-[highlighted]:text-fuchsia-100 data-[state=checked]:text-fuchsia-100"
              >
                Creative
              </SelectItem>
            </SelectContent>
          </Select>
        </header>

        {studioOpen ? (
          <LotusCreativeStudio
            onClose={() => setStudioOpen(false)}
            onUsePrompt={(prompt) => {
              setStudioOpen(false);
              void sendMessage(undefined, prompt);
            }}
          />
        ) : (
        <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col px-3 sm:px-6">
          <section
            className="chat-scrollbar min-h-0 flex-1 overflow-y-auto py-5"
            aria-label="Conversation with Lotus"
            aria-live="polite"
          >
            {historyLoading ? (
              <div className="flex h-full items-center justify-center gap-2 text-sm text-zinc-500">
                <LoaderCircle className="animate-spin text-fuchsia-300" size={16} aria-hidden="true" />
                Loading conversation
              </div>
            ) : messages.length === 0 ? (
              <div className="flex min-h-full flex-col items-center justify-center py-8 text-center">
                <div className="mb-1">
                  <LotusBloom />
                </div>
                <h1 className="font-serif text-3xl font-medium tracking-tight text-white">
                  Hello, I’m Lotus.
                </h1>
                <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-400">
                  What would you like to explore today?
                </p>
                <div className="mt-5 flex max-w-lg flex-wrap justify-center gap-2">
                  {openingSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setInput(suggestion)}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs text-zinc-300 transition hover:border-fuchsia-300/30 hover:bg-fuchsia-300/[0.08] hover:text-white"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 pb-4">
                {messages.map((message, index) =>
                  message.role === "user" ? (
                    <div
                      key={`user-${index}`}
                      className="flex justify-end animate-fade-msg"
                    >
                      <p className="max-w-[90%] whitespace-pre-wrap break-words rounded-[22px] rounded-br-md border border-fuchsia-300/15 bg-gradient-to-br from-violet-600/90 to-fuchsia-600/90 px-4 py-3 text-sm leading-6 text-white shadow-lg shadow-black/20 sm:max-w-[78%] sm:px-5">
                        {message.content}
                      </p>
                    </div>
                  ) : (
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
                        {message.content ? (
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={markdownComponents}
                          >
                            {message.content}
                          </ReactMarkdown>
                        ) : (
                          <p className="text-xs text-zinc-500">Preparing a reply…</p>
                        )}
                        {message.status === "failed" && (
                          <p className="mt-2 text-xs text-rose-300">
                            This reply could not be completed.
                          </p>
                        )}
                        {message.content && (
                          <div className="mt-3 flex flex-wrap items-center gap-1">
                            <button
                              type="button"
                              onClick={() => void copyMessage(message)}
                              aria-label="Copy response"
                              className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-200"
                            >
                              {copiedMessageId === message._id ? (
                                <Check size={14} aria-hidden="true" />
                              ) : (
                                <Copy size={14} aria-hidden="true" />
                              )}
                              {copiedMessageId === message._id ? "Copied" : "Copy"}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                navigate("/feed", {
                                  state: {
                                    openCreate: true,
                                    initialText: message.content,
                                  },
                                })
                              }
                              className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs text-zinc-500 transition hover:bg-fuchsia-300/[0.07] hover:text-fuchsia-100"
                            >
                              <MessageSquarePlus size={14} aria-hidden="true" />
                              Use in Thoughts
                            </button>
                            {index === messages.length - 1 && message.status !== "pending" && (
                              <button
                                type="button"
                                onClick={() => void regenerateLastReply()}
                                disabled={sending}
                                className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-200 disabled:opacity-40"
                              >
                                <RotateCcw size={13} aria-hidden="true" />
                                Regenerate
                              </button>
                            )}
                          </div>
                        )}
                        {index === messages.length - 1 &&
                          message.role === "assistant" &&
                          message.status === "complete" &&
                          !sending && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {followUpSuggestions.map((suggestion) => (
                                <button
                                  key={suggestion}
                                  type="button"
                                  onClick={() => void sendMessage(undefined, suggestion)}
                                  className="rounded-full border border-white/[0.08] bg-white/[0.025] px-3 py-1.5 text-[11px] text-zinc-400 transition hover:border-fuchsia-300/25 hover:bg-fuchsia-300/[0.06] hover:text-fuchsia-100"
                                >
                                  {suggestion}
                                </button>
                              ))}
                            </div>
                          )}
                      </div>
                    </article>
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

          {error && messages.length === 0 && (
            <p role="alert" className="mb-2 text-center text-sm text-rose-200">
              {error}
            </p>
          )}

          {pendingThoughtContext && (
            <div className="mb-2 flex items-center justify-between gap-3 rounded-xl border border-fuchsia-300/15 bg-fuchsia-300/[0.05] px-3 py-2">
              <p className="text-xs text-fuchsia-100/80">
                Lotus will use this post as context for your next message.
              </p>
              <button
                type="button"
                onClick={() => setPendingThoughtContext(null)}
                className="shrink-0 rounded-md px-2 py-1 text-[11px] text-zinc-400 hover:bg-white/[0.06] hover:text-white"
              >
                Remove context
              </button>
            </div>
          )}

          <form
            onSubmit={(event) => void sendMessage(event)}
            className="mb-[max(env(safe-area-inset-bottom),12px)] mt-3 w-full rounded-[24px] border border-white/[0.12] bg-[#17151b]/95 p-1.5 shadow-[0_10px_35px_-18px_rgba(0,0,0,0.9)] backdrop-blur-xl transition-colors focus-within:border-fuchsia-300/30"
          >
            <div className="flex items-end gap-2 pl-3">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  pendingThoughtContext
                    ? "Ask Lotus about this post..."
                    : "Ask Lotus anything..."
                }
                aria-label="Message Lotus"
                maxLength={2000}
                rows={1}
                className="max-h-32 min-h-11 flex-1 resize-none bg-transparent py-3 text-sm leading-5 text-zinc-100 outline-none placeholder:text-zinc-500"
              />
              {sending ? (
                <button
                  type="button"
                  onClick={stopGenerating}
                  aria-label="Stop generating"
                  title="Stop generating"
                  className="mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-zinc-200 transition hover:bg-white/10"
                >
                  <Square size={15} fill="currentColor" aria-hidden="true" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  aria-label="Send message"
                  className="mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-md shadow-fuchsia-950/30 transition-all hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <ArrowUp size={18} strokeWidth={2.2} aria-hidden="true" />
                </button>
              )}
            </div>
          </form>
        </div>
        )}
      </section>
    </main>
  );
}
