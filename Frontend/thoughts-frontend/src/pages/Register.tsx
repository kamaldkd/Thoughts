import { useState } from "react";
import api, { setAuthToken } from "@/lib/api";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await api.post("/auth/register", {
        username,
        email,
        password,
      });
      const token = res.data.token;
      localStorage.setItem("token", token);
      setAuthToken(token);
      navigate("/feed");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Registration failed");
    }
  }

  return (
    <div className="min-h-screen pt-16 flex items-start">
      <form
        onSubmit={handleSubmit}
        className="max-w-md mx-auto w-full p-6 glass-card"
      >
        <h2 className="text-2xl font-semibold mb-4">Create an account</h2>
        <input
          className="w-full p-3 mb-2 bg-transparent border border-border rounded"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          className="w-full p-3 mb-2 bg-transparent border border-border rounded"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="w-full p-3 mb-4 bg-transparent border border-border rounded"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="w-full px-4 py-2 bg-primary text-primary-foreground rounded">
          Create account
        </button>
      </form>
    </div>
  );
}
