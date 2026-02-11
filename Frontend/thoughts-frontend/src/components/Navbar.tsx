import { Link, useLocation, useNavigate } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";
import { Feather } from "lucide-react";
import { useEffect, useState } from "react";
import api, { setAuthToken } from "@/lib/api";

export function Navbar() {
  const location = useLocation();
  const isLanding = location.pathname === "/";
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await api.get("/users/me");
        if (mounted) setUser(res.data.user);
      } catch (err) {
        if (mounted) setUser(null);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    setAuthToken(null);
    setUser(null);
    navigate("/login");
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isLanding
          ? "bg-transparent"
          : "bg-background/80 backdrop-blur-xl border-b border-border/50"
      }`}
    >
      <nav className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <Feather className="h-5 w-5 text-primary transition-transform duration-300 group-hover:rotate-12" />
          <span className="text-lg font-semibold tracking-tight">Thoughts</span>
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {isLanding && (
            <Link
              to="/feed"
              className="inline-flex h-9 px-4 items-center rounded-full bg-primary text-primary-foreground text-sm font-medium transition-all duration-300 hover:opacity-90"
            >
              Explore
            </Link>
          )}
          {user ? (
            <>
              <Link to="/profile" className="inline-flex text-sm">
                {user.username || user.name}
              </Link>
              <button
                onClick={handleLogout}
                className="inline-flex text-sm bg-destructive text-destructive-foreground px-2 py-1 rounded"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="inline-flex text-sm">
                Login
              </Link>
              <Link to="/register" className="inline-flex text-sm">
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
