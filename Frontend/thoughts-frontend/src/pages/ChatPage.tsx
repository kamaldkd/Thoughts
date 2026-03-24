import { useState } from "react";
import { Sidebar } from "@/components/chat/Sidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { useChatStore } from "@/store/useChatStore";
import { useChatSocket } from "@/hooks/useChatSocket";
import { useAuth } from "@/hooks/useAuth";
import { getSocket } from "@/services/socket";
import { MessageSquare } from "lucide-react";

export default function ChatPage() {
  const { user } = useAuth();
  const selectedConversationId = useChatStore((s) => s.selectedConversationId);
  const selectConversation = useChatStore((s) => s.selectConversation);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  // Connect socket and register event listeners
  if (user) getSocket(); // ensure socket is initialized
  useChatSocket(user?._id ?? "");

  const handleSelectConversation = (id: string) => {
    selectConversation(id);
    setMobileChatOpen(true);
  };

  const handleBack = () => {
    setMobileChatOpen(false);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-slate-950 overflow-hidden">
      {/* ── LEFT SIDEBAR (Fixed Width) ── */}
      <Sidebar
        selectedId={selectedConversationId}
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
        {selectedConversationId ? (
          <ChatWindow
            key={selectedConversationId}
            conversationId={selectedConversationId}
            onBack={handleBack}
          />
        ) : (
          /* ── Empty state ── */
          <div className="flex flex-col items-center justify-center h-full gap-5 bg-slate-900/30">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600/20 to-indigo-600/20 flex items-center justify-center ring-1 ring-blue-500/20">
                <MessageSquare className="w-10 h-10 text-blue-400/70" />
              </div>
              {/* Pulsing ring */}
              <span className="absolute inset-0 rounded-full animate-ping bg-blue-500/10" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-slate-200">Your Messages</h2>
              <p className="text-sm text-slate-500 max-w-xs">
                Select a conversation from the sidebar to start chatting
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
