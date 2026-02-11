import { Link, useLocation } from "react-router-dom";
import { Home, Search, PenSquare, Heart, User } from "lucide-react";

const navItems = [
  { icon: Home, to: "/feed", label: "Home" },
  { icon: Search, to: "/explore", label: "Search" },
  { icon: PenSquare, to: "/create", label: "Create" },
  { icon: Heart, to: "/activity", label: "Activity" },
  { icon: User, to: "/profile", label: "Profile" },
];

export function BottomNav() {
  const location = useLocation();

  if (location.pathname === "/") return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-t border-border/50">
      <div className="flex items-center justify-around h-14 max-w-md mx-auto">
        {navItems.map(({ icon: Icon, to, label }) => {
          const active = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-0.5 p-2 transition-all duration-200 ${active ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
              aria-label={label}
            >
              <Icon className={`h-5 w-5 transition-transform duration-200 ${active ? "scale-110" : ""}`} strokeWidth={active ? 2.5 : 1.8} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
