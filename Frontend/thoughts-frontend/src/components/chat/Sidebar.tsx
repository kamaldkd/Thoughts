import { useEffect, useState } from "react";
import { useChatStore } from "@/store/useChatStore";
import { ConversationItem } from "./ConversationItem";
import { getConversations, createOrGetConversation } from "@/services/chatApi";
import { Search, MessageSquarePlus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { toast } from "sonner";

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
  const [searchResults, setSearchResults] = useState<any[]>([]);
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

  const allDisplayItems = [...filtered, ...suggestedConvs];

  const handleSelect = async (id: string, isNew?: boolean) => {
    if (isNew) {
      const realId = id.replace("new_", "");
      setStartingChat(realId);
      try {
        const conv = await createOrGetConversation(realId);
        // Clear search upon starting chat cleanly
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
        ) : allDisplayItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-sm gap-2">
            {isSearching ? (
              <Loader2 className="w-8 h-8 opacity-50 animate-spin" />
            ) : (
              <MessageSquarePlus className="w-10 h-10 opacity-30" />
            )}
            <p className="mt-2 text-center">
              {isSearching ? "Searching..." : search ? "No users found" : "No conversations yet"}
            </p>
          </div>
        ) : (
          <>
            {allDisplayItems.map((item) => {
              const loading = startingChat === item.participant._id;
              return (
                <div key={item._id} className="relative">
                   <ConversationItem
                    conversation={item as any}
                    isSelected={selectedId === item._id}
                    onClick={() => handleSelect(item._id, (item as any).isNew)}
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
      </div>
    </aside>
  );
};
