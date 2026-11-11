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
  const setSelectedConversationId = useChatStore((s) => s.setSelectedConversationId);

  useEffect(() => {
    if (user) getSocket();
  }, [user]);

  useChatSocket(user?._id ?? "");

  useEffect(() => {
    setSelectedConversationId(conversationId ?? null);
    if (conversationId) {
      clearUnread(conversationId);
      setMobileChatOpen(true);
    } else {
      setMobileChatOpen(false);
    }
    return () => setSelectedConversationId(null);
  }, [conversationId, clearUnread, setSelectedConversationId]);

  const handleSelectConversation = (id: string) => {
    navigate(`/messages/${id}`);
  };

  const handleBack = () => {
    navigate("/messages");
  };

  return (
    <div className="flex h-dvh w-full min-w-0 flex-col overflow-hidden bg-white dark:bg-black">
      <div className="flex h-full w-full min-w-0 flex-1 overflow-hidden bg-white dark:bg-black">

        {/* Sidebar */}
        <Sidebar
          selectedId={conversationId || null}
          onSelectConversation={handleSelectConversation}
          className={`w-full min-w-0 flex-shrink-0 md:w-[320px] lg:w-[340px] ${
            mobileChatOpen ? "hidden md:flex" : "flex"
          }`}
        />

        {/* Chat Window */}
        <main
          className={`min-w-0 w-0 flex-1 ${
            mobileChatOpen ? "flex" : "hidden md:flex"
          }`}
        >
          {conversationId ? (
            <ChatWindow
              key={conversationId}
              conversationId={conversationId}
              onBack={handleBack}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-5 bg-white px-6 dark:bg-black">
              <div className="relative">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
                  <MessageCircle className="h-9 w-9 text-primary" />
                </div>
              </div>
              <div className="text-center space-y-1.5">
                <h2 className="text-lg font-semibold text-foreground">
                  Your Messages
                </h2>
                <p className="max-w-[280px] text-sm leading-relaxed text-muted-foreground">
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