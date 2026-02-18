import { Link, useLocation } from "react-router-dom";
import { Home, Search, Send, Heart } from "lucide-react";
import { useState } from "react";
import { CreateThoughtModal } from "./CreateThoughtModal";
import { useActivityBadge } from "@/hooks/useActivityBadge";

const navItems = [
  { icon: Home, to: "/feed", label: "Home" },
  { icon: Search, to: "/explore", label: "Search" },
  { icon: Send, to: "/messages", label: "Messages" },
  { icon: Heart, to: "/activity", label: "Activity", showBadge: true },
];

export function BottomNav() {
  const location = useLocation();
  const [createOpen, setCreateOpen] = useState(false);
  const { hasUnread: hasUnreadActivity } = useActivityBadge();

  if (location.pathname === "/") return null;

  return (
    <>
      {/* Floating bottom nav */}
      <div className="fixed bottom-5 left-0 right-0 z-50 flex items-center justify-center gap-3 px-6">
        {/* Pill container */}
        <nav
          className="flex items-center gap-1 px-3 py-2.5 rounded-full"
          style={{
            background: "hsl(var(--card) / 0.85)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid hsl(var(--border) / 0.4)",
            boxShadow:
              "0 8px 32px hsl(var(--foreground) / 0.08), 0 2px 8px hsl(var(--foreground) / 0.04)",
          }}
        >
          {navItems.map(({ icon: Icon, to, label, showBadge }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className="relative flex items-center justify-center w-12 h-11 rounded-full transition-all duration-200"
                aria-label={label}
              >
                {/* Active bg highlight */}
                {active && (
                  <span className="absolute inset-0 rounded-full bg-primary/10" />
                )}

                <Icon
                  className="relative z-10 transition-all duration-200"
                  style={{
                    width: 22,
                    height: 22,
                    strokeWidth: active ? (Icon === Search ? 2.2 : 0) : 1.6,
                    fill: active && Icon !== Search
                      ? "hsl(var(--primary))"
                      : "transparent",
                    stroke: active
                      ? "hsl(var(--primary))"
                      : "hsl(var(--muted-foreground))",
                  }}
                />

                {/* Notification badge */}
                {showBadge && hasUnreadActivity && !active && (
                  <span className="absolute top-[12px] right-[11px] w-[7px] h-[7px] rounded-full bg-destructive ring-background z-20" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Create "+" button — separate circular button */}
        <button
          onClick={() => setCreateOpen(true)}
          aria-label="Create Thought"
          className="relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 active:scale-95"
          style={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border) / 0.5)",
            boxShadow:
              "0 4px 16px hsl(var(--foreground) / 0.10), 0 1px 4px hsl(var(--foreground) / 0.06)",
          }}
        >
          {/* Plus icon drawn manually for crispness */}
          <span
            className="absolute"
            style={{
              width: 18,
              height: 2,
              borderRadius: 1,
              background: "hsl(var(--foreground))",
            }}
          />
          <span
            className="absolute"
            style={{
              width: 2,
              height: 18,
              borderRadius: 1,
              background: "hsl(var(--foreground))",
            }}
          />
        </button>
      </div>

      <CreateThoughtModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </>
  );
}
