import { Link, useLocation } from "react-router-dom";
import { Home, Search, PenSquare, Heart, User } from "lucide-react";
import { useState } from "react";
import { CreateThoughtModal } from "./CreateThoughtModal";
import { useActivityBadge } from "@/hooks/useActivityBadge";

const navItems = [
  { icon: Home, to: "/feed", label: "Home" },
  { icon: Search, to: "/explore", label: "Search" },
  { icon: PenSquare, to: "/create", label: "Create" },
  { icon: Heart, to: "/activity", label: "Activity", showBadge: true },
  { icon: User, to: "/profile", label: "Profile" },
];

export function BottomNav() {
  const location = useLocation();
  const [createOpen, setCreateOpen] = useState(false);

  const { hasUnread: hasUnreadActivity } = useActivityBadge();
  if (location.pathname === "/") return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-t border-border/50">
      <div className="flex items-center justify-around h-14 max-w-md mx-auto">
        {navItems.map(({ icon: Icon, to, label, showBadge }) => {
          const active = location.pathname === to;
          return to !== "/create" ? (
            <Link
              key={to}
              to={to}
              className={`relative flex flex-col items-center gap-0.5 p-2 transition-all duration-200 ${
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label={label}
            >
              <Icon
                className={`h-5 w-5 transition-transform duration-200 ${
                  active ? "scale-110" : ""
                }`}
                strokeWidth={active ? 2.5 : 1.8}
              />
              {showBadge && hasUnreadActivity && !active && (
                <span className="absolute top-1.5 right-1.5 w-[7px] h-[7px] rounded-full bg-destructive ring-2 ring-background" />
              )}
            </Link>
          ) : (
            <button
              key={to}
              className="relative flex flex-col items-center gap-0.5 p-2 text-muted-foreground hover:text-foreground transition-all duration-200"
              onClick={() => setCreateOpen(true)}
              aria-label={label}
            >
              <Icon
                className="h-5 w-5 transition-transform duration-200"
                strokeWidth={1.8}
              />
            </button>
          );
        })}
      </div>
      <CreateThoughtModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </nav>
  );
}