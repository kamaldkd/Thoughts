
import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
} from "react";

import { useAuth } from "@/hooks/useAuth";

import {
  getUnreadNotificationCount,
  markAllNotificationsRead,
} from "@/lib/api";

interface ActivityBadgeContextType {
  unreadCount: number;
  hasUnread: boolean;
  refreshUnreadCount: () => Promise<void>;
  markAsSeen: () => Promise<void>;
}

const ActivityBadgeContext =
  createContext<ActivityBadgeContextType>({
    unreadCount: 0,
    hasUnread: false,
    refreshUnreadCount: async () => {},
    markAsSeen: async () => {},
  });

export function ActivityBadgeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoggedIn, loading } = useAuth();

  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    if (!isLoggedIn) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await getUnreadNotificationCount();

      setUnreadCount(response.data.count ?? 0);
    } catch (error) {
      console.error("Unable to fetch unread count:", error);
    }
  }, [isLoggedIn]);

  const markAsSeen = useCallback(async () => {
    if (!isLoggedIn) return;

    try {
      await markAllNotificationsRead();
      setUnreadCount(0);
    } catch (error) {
      console.error("Unable to mark notifications as read:", error);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (loading) return;

    void refreshUnreadCount();

    if (!isLoggedIn) return;

    const interval = window.setInterval(() => {
      void refreshUnreadCount();
    }, 30000);

    return () => window.clearInterval(interval);
  }, [loading, isLoggedIn, refreshUnreadCount]);

  return (
    <ActivityBadgeContext.Provider
      value={{
        unreadCount,
        hasUnread: unreadCount > 0,
        refreshUnreadCount,
        markAsSeen,
      }}
    >
      {children}
    </ActivityBadgeContext.Provider>
  );
}

export function useActivityBadge() {
  return useContext(ActivityBadgeContext);
}
