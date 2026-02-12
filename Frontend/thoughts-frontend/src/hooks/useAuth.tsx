import { createContext, useContext, useEffect, useState } from "react";
import api, { setAuthToken } from "@/lib/api";

interface User {
  _id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string
  ) => Promise<void>;
  logout: () => void;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
      setAuthToken(storedToken);
      // Optionally fetch user details
      fetchUserDetails(storedToken);
    }
    setLoading(false);
  }, []);

  async function fetchUserDetails(authToken: string) {
    try {
      const res = await api.get("/users/me");
      setUser(res.data.user);
    } catch (err) {
      console.error("Failed to fetch user details:", err);
      localStorage.removeItem("token");
      setToken(null);
      setAuthToken(null);
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

  async function register(username: string, email: string, password: string) {
    const res = await api.post("/auth/register", { username, email, password });
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
        isLoggedIn: !!token,
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
