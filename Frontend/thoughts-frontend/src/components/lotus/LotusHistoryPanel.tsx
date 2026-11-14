import { FileText, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { LotusMark } from "@/components/lotus/LotusBloom";
import type { LotusConversation } from "@/lib/api";

type Props = {
  conversations: LotusConversation[];
  activeConversationId?: string;
  onNewChat: () => void;
  onOpenStudio: () => void;
  onSelect: (id: string) => void;
  onRename: (conversation: LotusConversation) => void;
  onDelete: (conversation: LotusConversation) => void;
};

export default function LotusHistoryPanel({
  conversations,
  activeConversationId,
  onNewChat,
  onOpenStudio,
  onSelect,
  onRename,
  onDelete,
}: Props) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-1 pb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-fuchsia-300/20 bg-gradient-to-br from-fuchsia-400/15 to-violet-400/15 text-fuchsia-200">
          <LotusMark className="h-6 w-6" />
        </div>
        <div>
          <p className="font-serif text-lg font-medium text-white">Lotus</p>
          <p className="text-[11px] tracking-wide text-zinc-500">A thoughtful companion</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onNewChat}
        className="flex h-11 items-center gap-2.5 rounded-2xl border border-fuchsia-300/20 bg-gradient-to-r from-violet-500/15 to-fuchsia-500/15 px-3 text-sm font-medium text-fuchsia-100 transition hover:border-fuchsia-200/40 hover:from-violet-500/25 hover:to-fuchsia-500/25"
      >
        <Plus size={17} aria-hidden="true" />
        New conversation
      </button>
      <button
        type="button"
        onClick={onOpenStudio}
        className="mt-2 flex h-10 items-center gap-2.5 rounded-2xl px-3 text-left text-xs font-medium text-zinc-300 transition hover:bg-white/[0.05] hover:text-fuchsia-100"
      >
        <Sparkles size={15} className="text-fuchsia-300" aria-hidden="true" />
        Creative Studio
      </button>

      <div className="mb-2 mt-7 flex items-center justify-between px-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Recent conversations
        </p>
        <span className="text-[10px] text-zinc-600">{conversations.length}</span>
      </div>

      <div className="chat-scrollbar min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
        {conversations.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] px-3 py-4 text-xs leading-5 text-zinc-500">
            Your conversations will appear here.
          </div>
        ) : (
          conversations.map((conversation) => {
            const active = conversation._id === activeConversationId;
            return (
              <div
                key={conversation._id}
                className={`group flex items-center gap-1 rounded-xl border px-1 py-1 transition ${
                  active
                    ? "border-fuchsia-300/15 bg-fuchsia-300/[0.08]"
                    : "border-transparent hover:border-white/[0.06] hover:bg-white/[0.035]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelect(conversation._id)}
                  className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2 py-2 text-left"
                  aria-current={active ? "page" : undefined}
                >
                  <FileText
                    size={15}
                    className={active ? "shrink-0 text-fuchsia-200" : "shrink-0 text-zinc-500"}
                    aria-hidden="true"
                  />
                  <span className="truncate text-xs text-zinc-300">
                    {conversation.title}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onRename(conversation)}
                  aria-label={`Rename ${conversation.title}`}
                  title="Rename conversation"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 opacity-70 transition hover:bg-white/10 hover:text-zinc-200 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100"
                >
                  <Pencil size={13} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(conversation)}
                  aria-label={`Delete ${conversation.title}`}
                  title="Delete conversation"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 opacity-70 transition hover:bg-rose-400/10 hover:text-rose-200 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100"
                >
                  <Trash2 size={13} aria-hidden="true" />
                </button>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3">
        <p className="text-xs font-medium text-zinc-300">Your space, your pace</p>
        <p className="mt-1 text-[11px] leading-5 text-zinc-500">
          Lotus keeps your conversations private to your account.
        </p>
      </div>
    </div>
  );
}
