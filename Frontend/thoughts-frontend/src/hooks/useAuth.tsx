import { createContext, useContext, useEffect, useState } from "react";
import api, { fetchCsrfToken } from "@/lib/api";

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
      const res = await api.get("/users/me");
      setUser(res.data.user);
    } catch (err) {
      console.error("Failed to fetch user details:", err);
      setUser(null);
    }
  }

  async function login(email: string, password: string) {
    await api.post("/auth/login", { email, password });
    // Backend wiped the old CSRF secret, explicitly fast-fetch the rotated one.
    await fetchCsrfToken();
    await fetchUserDetails();
  }

  async function register(name: string, username: string, email: string, password: string) {
    await api.post("/auth/register", { name, username, email, password });
    // Backend wiped the old CSRF secret, explicitly fast-fetch the rotated one.
    await fetchCsrfToken();
    await fetchUserDetails();
  }

  async function logout() {
    try {
      await api.post("/auth/logout");
      // Destroy the unauthenticated old token and fetch the public zero-state token
      await fetchCsrfToken();
    } catch (err) {
      console.error("Logout failed:", err);
    }
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
