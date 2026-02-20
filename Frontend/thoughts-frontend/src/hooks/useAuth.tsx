import { createContext, useContext, useEffect, useState } from "react";
import api, { setAuthToken } from "@/lib/api";

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
  token: string | null;
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
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth from localStorage on mount
  useEffect(() => {
  const storedToken = localStorage.getItem("token");

  if (!storedToken) {
    setLoading(false);
    return;
  }

  setToken(storedToken);
  setAuthToken(storedToken);

  fetchUserDetails()
    .finally(() => {
      setLoading(false); // ✅ ONLY after fetch completes
    });
}, []);

  async function fetchUserDetails(authToken?: string) {
    try {
      const res = await api.get("/users/me");
      setUser(res.data.user);
    } catch (err) {
      console.error("Failed to fetch user details:", err);
      localStorage.removeItem("token");
      setToken(null);
      setAuthToken(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const res = await api.post("/auth/login", { email, password });
    const newToken = res.data.token;
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setAuthToken(newToken);
    await fetchUserDetails(newToken);
  }

  async function register(name: string, username: string, email: string, password: string) {
    const res = await api.post("/auth/register", { name, username, email, password });
    const newToken = res.data.token;
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setAuthToken(newToken);
    await fetchUserDetails(newToken);
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setAuthToken(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isLoggedIn: !!token && !!user,
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
