import { useCallback, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getUnreadMessageCount } from "@/services/chatApi";
import { getSocket } from "@/services/socket";
import { useChatStore } from "@/store/useChatStore";

export function ChatBadgeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoggedIn, loading } = useAuth();
  const setUnreadMessageCount = useChatStore((state) => state.setUnreadMessageCount);

  const refreshUnreadCount = useCallback(async () => {
    if (!isLoggedIn) {
      setUnreadMessageCount(0);
      return;
    }

    try {
      setUnreadMessageCount(await getUnreadMessageCount());
    } catch (error) {
      console.error("Unable to fetch unread message count:", error);
    }
  }, [isLoggedIn, setUnreadMessageCount]);

  useEffect(() => {
    if (loading) return;
    if (!isLoggedIn) {
      setUnreadMessageCount(0);
      return;
    }

    const socket = getSocket();
    let refreshTimer: number | undefined;
    const refreshAfterIncomingMessage = () => {
      if (refreshTimer !== undefined) window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => {
        void refreshUnreadCount();
      }, 500);
    };

    void refreshUnreadCount();
    const interval = window.setInterval(() => {
      void refreshUnreadCount();
    }, 30000);

    socket.on("receive_message", refreshAfterIncomingMessage);
    socket.on("message_seen", refreshAfterIncomingMessage);

    return () => {
      window.clearInterval(interval);
      if (refreshTimer !== undefined) window.clearTimeout(refreshTimer);
      socket.off("receive_message", refreshAfterIncomingMessage);
      socket.off("message_seen", refreshAfterIncomingMessage);
    };
  }, [isLoggedIn, loading, refreshUnreadCount, setUnreadMessageCount]);

  return children;
}
