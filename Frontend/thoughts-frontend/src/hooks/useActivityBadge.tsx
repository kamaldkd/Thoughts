import { createContext, useContext, useState, useCallback } from "react";

interface ActivityBadgeContextType {
  hasUnread: boolean;
  markAsSeen: () => void;
  setHasUnread: (v: boolean) => void;
}

const ActivityBadgeContext = createContext<ActivityBadgeContextType>({
  hasUnread: false,
  markAsSeen: () => {},
  setHasUnread: () => {},
});

export function ActivityBadgeProvider({ children }: { children: React.ReactNode }) {
  // TODO: replace initial value with real API check
  const [hasUnread, setHasUnread] = useState(true);

  const markAsSeen = useCallback(() => setHasUnread(false), []);

  return (
    <ActivityBadgeContext.Provider value={{ hasUnread, markAsSeen, setHasUnread }}>
      {children}
    </ActivityBadgeContext.Provider>
  );
}

export function useActivityBadge() {
  return useContext(ActivityBadgeContext);
}
