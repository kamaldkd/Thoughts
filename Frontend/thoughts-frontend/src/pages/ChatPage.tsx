import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/chat/Sidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { useChatStore } from "@/store/useChatStore";
import { useChatSocket } from "@/hooks/useChatSocket";
import { useAuth } from "@/hooks/useAuth";
import { getSocket } from "@/services/socket";
import { MessageSquare, Search } from "lucide-react";

export default function ChatPage() {
  const { user } = useAuth();
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  
  const clearUnread = useChatStore((s) => s.clearUnread);

  // Connect socket and register event listeners
  if (user) getSocket(); // ensure socket is initialized
  useChatSocket(user?._id ?? "");

  // Clear unreads when the URL changes
  useEffect(() => {
    if (conversationId) {
      clearUnread(conversationId);
      setMobileChatOpen(true);
    } else {
      setMobileChatOpen(false);
    }
  }, [conversationId, clearUnread]);

  const handleSelectConversation = (id: string) => {
    navigate(`/messages/${id}`);
  };

  const handleBack = () => {
    navigate("/messages");
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-slate-950 overflow-hidden relative">
      {/* ── LEFT SIDEBAR (Fixed Width) ── */}
      <Sidebar
        selectedId={conversationId || null}
        onSelectConversation={handleSelectConversation}
        className={`
          w-full md:w-[260px] lg:w-[300px] flex-shrink-0
          ${mobileChatOpen ? "hidden md:flex" : "flex"}
          md:flex flex-col
        `}
      />

      {/* ── RIGHT CHAT WINDOW (70%) ── */}
      <main
        className={`
          flex-1 min-w-0
          ${mobileChatOpen ? "flex" : "hidden md:flex"}
          md:flex flex-col
        `}
      >
        {conversationId ? (
          <ChatWindow
            key={conversationId}
            conversationId={conversationId}
            onBack={handleBack}
          />
        ) : (
          /* ── Empty state ── */
          <div className="flex flex-col items-center justify-center h-full gap-5 bg-slate-900/30">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-600/10 to-indigo-600/10 flex items-center justify-center ring-1 ring-blue-500/20 shadow-lg shadow-blue-500/5">
                <Search className="w-10 h-10 text-blue-400/80" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-slate-200">Start a Conversation</h2>
              <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
                Search for a user in the sidebar or select an existing chat to begin messaging.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
