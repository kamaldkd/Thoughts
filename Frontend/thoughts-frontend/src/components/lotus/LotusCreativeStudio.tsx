import { useState } from "react";
import { ArrowLeft, ArrowUpRight, Sparkles } from "lucide-react";

type Tool = {
  label: string;
  description: string;
  prompt: (text: string) => string;
  requiresText?: boolean;
};

const tools: Tool[] = [
  {
    label: "Improve writing",
    description: "Make the message clearer and more polished.",
    prompt: (text) => `Improve this writing while preserving its meaning and voice:\n\n${text}`,
    requiresText: true,
  },
  {
    label: "Fix grammar",
    description: "Correct grammar and spelling without changing the meaning.",
    prompt: (text) => `Fix the grammar and spelling in this text without changing its meaning:\n\n${text}`,
    requiresText: true,
  },
  {
    label: "Rewrite text",
    description: "Try a fresh version with the same intent.",
    prompt: (text) => `Rewrite this text for clarity while preserving its intent:\n\n${text}`,
    requiresText: true,
  },
  {
    label: "Make professional",
    description: "Give your message a more professional tone.",
    prompt: (text) => `Rewrite this in a polished, professional tone:\n\n${text}`,
    requiresText: true,
  },
  {
    label: "Make conversational",
    description: "Make it sound natural and approachable.",
    prompt: (text) => `Rewrite this to sound natural, warm, and conversational:\n\n${text}`,
    requiresText: true,
  },
  {
    label: "Generate captions",
    description: "Get a handful of caption options for a topic or post.",
    prompt: (text) =>
      `Generate 5 concise, engaging caption options${text ? ` for this topic or post:\n\n${text}` : "."}`,
  },
  {
    label: "Generate hashtags",
    description: "Find relevant hashtags for your post.",
    prompt: (text) =>
      `Suggest a thoughtful set of relevant hashtags${text ? ` for this post:\n\n${text}` : " for a social post"}.`,
  },
  {
    label: "Thoughts post ideas",
    description: "Explore original ideas worth sharing.",
    prompt: (text) =>
      `Generate 5 original, specific post ideas for Thoughts${text ? ` about:\n\n${text}` : "."}`,
  },
  {
    label: "Summarize text",
    description: "Capture the key points in fewer words.",
    prompt: (text) => `Summarize this text, preserving the key points:\n\n${text}`,
    requiresText: true,
  },
  {
    label: "Brainstorm ideas",
    description: "Explore possibilities and practical next steps.",
    prompt: (text) =>
      `Brainstorm a useful range of creative, practical ideas${text ? ` about:\n\n${text}` : "."}`,
  },
];

type Props = {
  onClose: () => void;
  onUsePrompt: (prompt: string) => void;
};

export default function LotusCreativeStudio({ onClose, onUsePrompt }: Props) {
  const [draft, setDraft] = useState("");
  const trimmedDraft = draft.trim();

  return (
    <div className="chat-scrollbar min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl px-1 py-7 sm:px-4 sm:py-10">
        <button
          type="button"
          onClick={onClose}
          className="mb-7 inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Back to conversation
        </button>

        <div className="relative overflow-hidden rounded-[28px] border border-fuchsia-300/15 bg-gradient-to-br from-fuchsia-500/[0.12] via-violet-500/[0.08] to-white/[0.025] p-5 sm:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-10 -top-14 h-48 w-48 rounded-full bg-fuchsia-500/10 blur-3xl"
          />
          <div className="relative flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-fuchsia-200/20 bg-fuchsia-300/10 text-fuchsia-200">
              <Sparkles size={20} aria-hidden="true" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-fuchsia-200/75">
                Lotus
              </p>
              <h1 className="font-serif text-2xl font-medium text-white sm:text-3xl">
                Creative Studio
              </h1>
            </div>
          </div>
          <p className="relative mt-3 max-w-xl text-sm leading-6 text-zinc-400">
            Shape a thought, polish a draft, or spark your next idea. Choose a tool
            and Lotus will continue in this conversation.
          </p>

          <label
            htmlFor="lotus-studio-draft"
            className="relative mb-2 mt-6 block text-xs font-medium text-zinc-300"
          >
            What are you working on?
          </label>
          <textarea
            id="lotus-studio-draft"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={1800}
            rows={5}
            placeholder="Paste a draft, describe a topic, or leave this blank to start with a general idea..."
            className="relative w-full resize-y rounded-2xl border border-white/10 bg-[#100e14]/80 px-4 py-3 text-sm leading-6 text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-fuchsia-300/35"
          />
          <div className="mt-1 flex justify-end text-[10px] text-zinc-600">
            {draft.length}/1,800
          </div>
        </div>

        <div className="mb-3 mt-8 flex items-end justify-between px-1">
          <div>
            <h2 className="text-sm font-semibold text-zinc-200">Choose a starting point</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Your draft stays editable before anything is shared.
            </p>
          </div>
          <Sparkles size={15} className="mb-1 text-fuchsia-300/70" aria-hidden="true" />
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {tools.map((tool, index) => {
            const disabled = Boolean(tool.requiresText && !trimmedDraft);
            return (
              <button
                key={tool.label}
                type="button"
                disabled={disabled}
                onClick={() => onUsePrompt(tool.prompt(trimmedDraft))}
                className="group flex min-h-[82px] items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3 text-left transition hover:border-fuchsia-300/25 hover:bg-fuchsia-300/[0.055] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-fuchsia-300/10 bg-gradient-to-br from-violet-400/10 to-fuchsia-400/10 font-serif text-sm text-fuchsia-200">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold text-zinc-200 transition group-hover:text-white">
                    {tool.label}
                  </span>
                  <span className="mt-1 block text-[11px] leading-4 text-zinc-500">
                    {tool.description}
                  </span>
                </span>
                <ArrowUpRight
                  size={15}
                  className="shrink-0 text-zinc-600 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-fuchsia-200"
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
