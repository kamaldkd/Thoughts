import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/chat/Sidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { useChatStore } from "@/store/useChatStore";
import { useChatSocket } from "@/hooks/useChatSocket";
import { useAuth } from "@/hooks/useAuth";
import { getSocket } from "@/services/socket";
import { MessageCircle } from "lucide-react";

export default function ChatPage() {
  const { user } = useAuth();
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  const clearUnread = useChatStore((s) => s.clearUnread);

  useEffect(() => {
    if (user) getSocket();
  }, [user]);

  useChatSocket(user?._id ?? "");

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
    <div className="flex flex-col h-[calc(100vh-64px)] bg-background">
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <Sidebar
          selectedId={conversationId || null}
          onSelectConversation={handleSelectConversation}
          className={`w-full md:w-[320px] lg:w-[340px] flex-shrink-0 ${
            mobileChatOpen ? "hidden md:flex" : "flex"
          }`}
        />

        {/* Chat Window */}
        <main className={`flex-1 ${mobileChatOpen ? "flex" : "hidden md:flex"}`}>
          {conversationId ? (
            <ChatWindow
              key={conversationId}
              conversationId={conversationId}
              onBack={handleBack}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-5 bg-slate-950/30">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600/10 to-indigo-600/10 flex items-center justify-center border border-blue-500/10 shadow-lg shadow-blue-500/5">
                  <MessageCircle className="w-9 h-9 text-blue-400/70" />
                </div>
              </div>
              <div className="text-center space-y-1.5">
                <h2 className="text-lg font-semibold text-slate-200">
                  Your Messages
                </h2>
                <p className="text-sm text-slate-500 max-w-[280px] leading-relaxed">
                  Select a conversation or search for someone to start chatting.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}