import { useEffect, useState } from "react";
import { useChatStore } from "@/store/useChatStore";
import { ConversationItem } from "./ConversationItem";
import { getConversations } from "@/services/chatApi";
import { Search, MessageSquarePlus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  onSelectConversation: (id: string) => void;
  selectedId: string | null;
  className?: string;
}

const SkeletonItem = () => (
  <div className="flex items-center gap-3 px-4 py-3 animate-pulse">
    <div className="w-12 h-12 rounded-full bg-slate-700" />
    <div className="flex-1 space-y-2">
      <div className="h-3 bg-slate-700 rounded w-1/2" />
      <div className="h-3 bg-slate-700/60 rounded w-3/4" />
    </div>
  </div>
);

export const Sidebar = ({ onSelectConversation, selectedId, className }: SidebarProps) => {
  const conversations = useChatStore((s) => s.conversations);
  const conversationsLoading = useChatStore((s) => s.conversationsLoading);
  const setConversations = useChatStore((s) => s.setConversations);
  const setConversationsLoading = useChatStore((s) => s.setConversationsLoading);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setConversationsLoading(true);
    getConversations()
      .then(setConversations)
      .catch(console.error)
      .finally(() => setConversationsLoading(false));
  }, [setConversations, setConversationsLoading]);

  const filtered = conversations.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.participant?.name?.toLowerCase().includes(q) ||
      c.participant?.username?.toLowerCase().includes(q)
    );
  });

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-slate-900 border-r border-slate-800",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
        <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
          Messages
        </h1>
        <button
          className="p-2 rounded-xl text-slate-400 hover:text-blue-400 hover:bg-slate-700/60 transition-all duration-200"
          title="New conversation"
        >
          <MessageSquarePlus className="w-5 h-5" />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations…"
            className="w-full pl-9 pr-4 py-2.5 bg-slate-700/50 text-slate-200 placeholder-slate-500 rounded-xl text-sm outline-none border border-transparent focus:border-blue-500/40 transition-all duration-200"
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-2 space-y-0.5 scrollbar-thin scrollbar-thumb-slate-700">
        {conversationsLoading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonItem key={i} />)
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-sm gap-2">
            <MessageSquarePlus className="w-10 h-10 opacity-30" />
            <p>{search ? "No results found" : "No conversations yet"}</p>
          </div>
        ) : (
          filtered.map((conv) => (
            <ConversationItem
              key={conv._id}
              conversation={conv}
              isSelected={selectedId === conv._id}
              onClick={() => onSelectConversation(conv._id)}
            />
          ))
        )}
      </div>
    </aside>
  );
};
