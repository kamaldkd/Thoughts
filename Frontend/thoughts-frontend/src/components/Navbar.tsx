import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, Plus, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { CreateThoughtModal } from "./CreateThoughtModal";
import { ThemeToggle } from "./ThemeToggle";

interface UserAvatarProps {
  avatarUrl?: string | null;
  username?: string;
  size?: number;
}

function UserAvatar({ avatarUrl, username, size = 32 }: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={username ?? "Profile"}
        onError={() => setImgError(true)}
        style={{ width: size, height: size }}
        className="rounded-full object-cover"
      />
    );
  }

  // Default neutral silhouette
  return (
    <span
      className="flex items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: "hsl(var(--muted))",
      }}
    >
      <User
        style={{
          width: size * 0.55,
          height: size * 0.55,
          stroke: "hsl(var(--muted-foreground))",
          strokeWidth: 1.8,
          fill: "transparent",
        }}
      />
    </span>
  );
}

export function Navbar() {
  const location = useLocation();
  const isLanding = location.pathname === "/";
  const { user, isLoggedIn, loading } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);

  // Hide the new nav on the landing page — keep original transparent look
  if (isLanding) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 bg-transparent transition-all duration-500">
        <nav className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-lg font-semibold tracking-tight">Thoughts</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/feed"
              className="inline-flex h-9 px-4 items-center rounded-full bg-primary text-primary-foreground text-sm font-medium transition-all duration-300 hover:opacity-90"
            >
              Explore
            </Link>
            {!loading && !isLoggedIn && (
              <>
                <Link to="/login" className="inline-flex text-sm">Login</Link>
                <Link to="/register" className="inline-flex text-sm">Sign up</Link>
              </>
            )}
          </div>
        </nav>
      </header>
    );
  }

  return (
    <>
      {/* App nav bar — solid, iOS-style */}
      <header
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: "hsl(var(--background))",
          borderBottom: "1px solid hsl(var(--border) / 0.35)",
          paddingTop: "env(safe-area-inset-top, 0px)",
        }}
      >
        <nav
          className="max-w-2xl mx-auto flex items-center justify-between"
          style={{ height: 52, paddingLeft: 16, paddingRight: 12 }}
        >
          {/* Left — Feed label + dropdown arrow */}
          <button
            className="flex items-center gap-1 transition-opacity duration-150 active:opacity-60"
            aria-label="Switch feed"
          >
            <span
              className="text-foreground"
              style={{
                fontSize: 18,
                fontWeight: 650,
                letterSpacing: "-0.3px",
                lineHeight: 1,
              }}
            >
              For You
            </span>
            <ChevronDown
              style={{
                width: 16,
                height: 16,
                stroke: "hsl(var(--foreground))",
                strokeWidth: 2.2,
                marginTop: 1,
              }}
            />
          </button>
          
          {/* Center — intentionally empty */}
          <div />

          {/* Right — Create + Avatar */}
          <div className="flex items-center gap-2">
            {/* Create "+" button */}
            <button
              onClick={() => setCreateOpen(true)}
              aria-label="Create thought"
              className="flex items-center justify-center rounded-full transition-all duration-150 active:scale-90 active:opacity-70"
              style={{
                width: 34,
                height: 34,
                background: "hsl(var(--primary))",
              }}
            >
              <Plus
                style={{
                  width: 18,
                  height: 18,
                  stroke: "hsl(var(--primary-foreground))",
                  strokeWidth: 2.4,
                }}
              />
            </button>

            {/* Avatar / profile button */}
            {!loading && isLoggedIn && user && (
              <Link
                to={`/profile`}
                aria-label="Profile"
                className="flex items-center justify-center rounded-full transition-all duration-150 active:scale-90 active:opacity-70 overflow-hidden"
                style={{
                  width: 34,
                  height: 34,
                  border: "1.5px solid hsl(var(--border) / 0.5)",
                }}
              >
                <UserAvatar
                  avatarUrl={(user as any).avatar ?? null}
                  username={user.username}
                  size={34}
                />
              </Link>
            )}

            {/* Not logged in */}
            {!loading && !isLoggedIn && (
              <Link
                to="/login"
                className="text-sm font-medium text-primary transition-opacity active:opacity-60"
              >
                Login
              </Link>
            )}
          </div>
        </nav>
      </header>

      <CreateThoughtModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </>
  );
}