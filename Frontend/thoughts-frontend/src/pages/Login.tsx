import { useState, useEffect } from "react";
import { Link, useNavigate, Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { InputField } from "@/components/auth/InputField";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { Divider } from "@/components/auth/Divider";
import { Loader2 } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isLoggedIn } = useAuth();

  // Show error message if redirected back from OAuth with an error
  useEffect(() => {
    if (searchParams.get("error") === "oauth_failed") {
      setError("Google sign-in failed. Please try again or use email/password.");
    }
  }, [searchParams]);

  // Route Guard: Redirect logged-in users out of the Auth silo
  if (isLoggedIn) {
    return <Navigate to="/feed" replace />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
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
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to your account to continue"
      footer={
        <p className="text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/register" className="font-semibold text-primary hover:opacity-80">
            Sign up
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-1">
        {error && (
          <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-center text-sm text-destructive">
            {error}
          </div>
        )}
        <InputField
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />
        <InputField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="mt-3 flex h-10 w-full items-center justify-center rounded-md bg-primary font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-70"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Log in"}
        </button>
      </form>
      <Divider />
      <GoogleButton isLoading={isLoading} />
    </AuthLayout>
  );
}
