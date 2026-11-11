import { useEffect, useRef, useState } from "react";
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
    <div className="w-11 h-11 rounded-full bg-muted" />
    <div className="flex-1 space-y-2">
      <div className="h-3 w-1/2 rounded-md bg-muted" />
      <div className="h-3 w-3/4 rounded-md bg-muted/60" />
    </div>
  </div>
);

export const Sidebar = ({ onSelectConversation, selectedId, className }: SidebarProps) => {
  const conversations = useChatStore((s) => s.conversations);
  const conversationsLoading = useChatStore((s) => s.conversationsLoading);
  const setConversations = useChatStore((s) => s.setConversations);
  const setConversationsLoading = useChatStore((s) => s.setConversationsLoading);
  const upsertConversation = useChatStore((s) => s.upsertConversation);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ _id: string; name: string; username: string; avatar?: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [startingChat, setStartingChat] = useState<string | null>(null);

  useEffect(() => {
    setConversationsLoading(true);
    getConversations()
      .then(setConversations)
      .catch((err) => {
        console.error("Failed to load conversations", err);
        toast.error("Failed to load conversations");
      })
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
        upsertConversation(conv);
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
        "flex h-full flex-col border-r border-border/60 bg-white dark:border-neutral-800 dark:bg-black",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
          Messages
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">Your conversations</p>
        </div>
        <button
          className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          title="New conversation"
          aria-label="Start a new conversation"
          onClick={() => searchInputRef.current?.focus()}
        >
          <MessageSquarePlus className="h-5 w-5" />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={searchInputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations…"
            className="w-full rounded-xl border border-border/70 bg-white py-2.5 pl-9 pr-8 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/10 dark:border-neutral-800 dark:bg-black"
          />
          {search && (
            <button
              onClick={clearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Conversation list */}
      <div className="chat-scrollbar flex-1 space-y-0.5 overflow-y-auto px-2 pb-24 md:pb-4">
        {conversationsLoading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonItem key={i} />)
        ) : filtered.length === 0 && suggestedConvs.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
            {isSearching ? (
              <Loader2 className="w-8 h-8 opacity-50 animate-spin" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted dark:bg-neutral-900">
                <MessageSquarePlus className="h-8 w-8 opacity-40" />
              </div>
            )}
            <p className="mt-2 text-center text-muted-foreground">
              {isSearching ? "Searching…" : search ? "No users found" : "No conversations yet"}
            </p>
            {!search && (
              <p className="max-w-[180px] text-center text-xs text-muted-foreground/80">
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
                  <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
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
                <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
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
                        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/70 backdrop-blur-[1px] transition-all">
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
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
