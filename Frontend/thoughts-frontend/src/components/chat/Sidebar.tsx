import { useEffect, useState } from "react";
import { useChatStore } from "@/store/useChatStore";
import { ConversationItem } from "./ConversationItem";
import { getConversations, createOrGetConversation } from "@/services/chatApi";
import { Search, MessageSquarePlus, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { toast } from "sonner";
import type { Conversation } from "@/services/chatApi";

interface SidebarProps {
  onSelectConversation: (id: string) => void;
  selectedId: string | null;
  className?: string;
}

const SkeletonItem = () => (
  <div className="flex items-center gap-3 px-3 py-3 animate-pulse">
    <div className="w-11 h-11 rounded-full bg-slate-800" />
    <div className="flex-1 space-y-2">
      <div className="h-3 bg-slate-800 rounded-md w-1/2" />
      <div className="h-3 bg-slate-800/60 rounded-md w-3/4" />
    </div>
  </div>
);

export const Sidebar = ({ onSelectConversation, selectedId, className }: SidebarProps) => {
  const conversations = useChatStore((s) => s.conversations);
  const conversationsLoading = useChatStore((s) => s.conversationsLoading);
  const setConversations = useChatStore((s) => s.setConversations);
  const setConversationsLoading = useChatStore((s) => s.setConversationsLoading);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ _id: string; name: string; username: string; avatar?: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [startingChat, setStartingChat] = useState<string | null>(null);

  useEffect(() => {
    setConversationsLoading(true);
    getConversations()
      .then(setConversations)
      .catch(console.error)
      .finally(() => setConversationsLoading(false));
  }, [setConversations, setConversationsLoading]);

  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.get(`/users/search?q=${encodeURIComponent(search)}`);
        setSearchResults(res.data.data || []);
      } catch (err) {
        console.error("Failed to search users", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const existingParticipantIds = new Set(conversations.map((c) => c.participant?._id));

  const filtered = conversations.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.participant?.name?.toLowerCase().includes(q) ||
      c.participant?.username?.toLowerCase().includes(q)
    );
  });

  const uniqueUsers = searchResults.filter((u) => !existingParticipantIds.has(u._id));
  const suggestedConvs = uniqueUsers.map((u) => ({
    _id: `new_${u._id}`,
    participant: u,
    isNew: true,
  }));

  const handleSelect = async (id: string, isNew?: boolean) => {
    if (isNew) {
      const realId = id.replace("new_", "");
      setStartingChat(realId);
      try {
        const conv = await createOrGetConversation(realId);
        setSearch("");
        onSelectConversation(conv._id);
      } catch (err) {
        console.error("Start chat error", err);
        toast.error("Failed to start conversation");
      } finally {
        setStartingChat(null);
      }
    } else {
      onSelectConversation(id);
    }
  };

  const clearSearch = () => {
    setSearch("");
    setSearchResults([]);
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-slate-950/50 border-r border-slate-800/60",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60">
        <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
          Messages
        </h1>
        <button
          className="p-2 rounded-xl text-slate-400 hover:text-blue-400 hover:bg-slate-800/60 transition-all duration-200"
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
            className="w-full pl-9 pr-8 py-2.5 bg-slate-800/60 text-slate-200 placeholder-slate-500 rounded-xl text-sm outline-none border border-transparent focus:border-blue-500/30 transition-all duration-200"
          />
          {search && (
            <button
              onClick={clearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-500 hover:text-slate-300 hover:bg-slate-700 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-2 space-y-0.5 chat-scrollbar">
        {conversationsLoading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonItem key={i} />)
        ) : filtered.length === 0 && suggestedConvs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-sm gap-2">
            {isSearching ? (
              <Loader2 className="w-8 h-8 opacity-50 animate-spin" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center">
                <MessageSquarePlus className="w-8 h-8 opacity-30" />
              </div>
            )}
            <p className="mt-2 text-center text-slate-500">
              {isSearching ? "Searching…" : search ? "No users found" : "No conversations yet"}
            </p>
            {!search && (
              <p className="text-xs text-slate-600 text-center max-w-[180px]">
                Search for someone to start chatting
              </p>
            )}
          </div>
        ) : (
          <>
            {/* Existing conversations */}
            {filtered.length > 0 && (
              <>
                {search && suggestedConvs.length > 0 && (
                  <p className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                    Conversations
                  </p>
                )}
                {filtered.map((item) => (
                  <ConversationItem
                    key={item._id}
                    conversation={item}
                    isSelected={selectedId === item._id}
                    onClick={() => handleSelect(item._id)}
                  />
                ))}
              </>
            )}

            {/* New user suggestions */}
            {suggestedConvs.length > 0 && (
              <>
                <p className="px-3 pt-3 pb-1 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                  Start New Chat
                </p>
                {suggestedConvs.map((item) => {
                  const loading = startingChat === item.participant._id;
                  return (
                    <div key={item._id} className="relative">
                      <ConversationItem
                        conversation={item as unknown as Conversation}
                        isSelected={false}
                        onClick={() => handleSelect(item._id, true)}
                      />
                      {loading && (
                        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px] rounded-xl flex items-center justify-center z-10 transition-all">
                          <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </>
        )}
      </div>
    </aside>
  );
};
