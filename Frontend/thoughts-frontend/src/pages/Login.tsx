import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await login(email, password);
      navigate("/feed");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen pt-16 flex items-start">
      <form
        onSubmit={handleSubmit}
        className="max-w-md mx-auto w-full p-6 glass-card"
      >
        <h2 className="text-2xl font-semibold mb-4">Login</h2>
        {error && <div className="text-red-500 mb-4 text-sm">{error}</div>}
        <input
          className="w-full p-3 mb-2 bg-transparent border border-border rounded"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          className="w-full p-3 mb-4 bg-transparent border border-border rounded"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          disabled={isLoading}
          className="w-full px-4 py-2 bg-primary text-primary-foreground rounded disabled:opacity-50"
        >
          {isLoading ? "Signing in..." : "Sign in"}
        </button>
        <p className="mt-4 text-sm text-center">
          Don't have an account?{" "}
          <a href="/register" className="text-primary hover:underline">
            Register here
          </a>
        </p>
      </form>
    </div>
  );
}
