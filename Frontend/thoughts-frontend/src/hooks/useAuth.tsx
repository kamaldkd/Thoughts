import { createContext, useContext, useEffect, useState } from "react";
import api, { fetchCsrfToken, setAccessToken } from "@/lib/api";


interface User {
  _id: string;
  name: string;
  username: string;
  email: string;
  bio?: string;
  website?: string;
  location?: string;
  avatar?: string;
  isPrivate?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    username: string,
    email: string,
    password: string
  ) => Promise<void>;
  logout: () => void;
  isLoggedIn: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth on mount
  useEffect(() => {
    fetchUserDetails().finally(() => {
      setLoading(false);
    });
  }, []);

  async function fetchUserDetails() {
    try {
      // On page refresh, accessTokenInMemory is null. The api interceptor will:
      // 1. Send the request without a Bearer header (no in-memory token)
      // 2. If the server returns 401, automatically call /auth/refresh using the
      //    refreshToken HttpOnly cookie, obtain a new accessToken, store it in memory,
      //    then retry this request transparently.
      // So this single call handles both "already have token" and "need to restore session".
      const res = await api.get("/users/me");
      setUser(res.data.user);
    } catch (err: any) {
      // 401 after failed refresh = no valid session → user needs to log in
      // Other errors (network, 500, etc.) → treat as not logged in for safety
      if (err?.response?.status !== 401) {
        console.error("Failed to fetch user details:", err);
      }
      setUser(null);
    }
  }

  async function login(email: string, password: string) {
    const res = await api.post("/auth/login", { email, password });
    // Store accessToken in memory → sent as Authorization: Bearer on all subsequent requests.
    // This works on ALL browsers regardless of cookie policy.
    if (res.data?.accessToken) setAccessToken(res.data.accessToken);
    // Fetch CSRF token and user details in parallel — don't block on slow CSRF.
    await Promise.allSettled([fetchCsrfToken(), fetchUserDetails()]);
  }

  async function register(name: string, username: string, email: string, password: string) {
    const res = await api.post("/auth/register", { name, username, email, password });
    if (res.data?.accessToken) setAccessToken(res.data.accessToken);
    await Promise.allSettled([fetchCsrfToken(), fetchUserDetails()]);
  }

  async function logout() {
    try {
      await api.post("/auth/logout");
      await fetchCsrfToken();
    } catch (err) {
      console.error("Logout failed:", err);
    }
    setAccessToken(null);  // clear in-memory token
    setUser(null);
  }


  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isLoggedIn: !!user,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}