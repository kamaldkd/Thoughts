import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { setAccessToken, fetchCsrfToken } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import AppLoader from "@/components/AppLoader";

/**
 * OAuthCallback — landing page after Google OAuth redirect.
 *
 * The backend can't set cookies cross-domain (Render → Vercel redirect), so it
 * passes the accessToken as a URL query param: /auth/callback?token=<jwt>
 *
 * This page:
 *  1. Reads the token from the URL immediately
 *  2. Stores it in memory via setAccessToken()
 *  3. Clears it from the URL so it never sits visible in the address bar
 *  4. Fetches the user profile (which also triggers CSRF bootstrap)
 *  5. Navigates to /feed on success, /login on failure
 */
export default function OAuthCallback() {
  const navigate = useNavigate();
  const { login: _login, ...auth } = useAuth() as any;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const error = params.get("error");

    // Remove token from URL immediately — don't let it sit in address bar or history
    window.history.replaceState({}, document.title, window.location.pathname);

    if (error || !token) {
      console.error("OAuth callback error:", error || "no token received");
      navigate("/login?error=oauth_failed", { replace: true });
      return;
    }

    const completeLogin = async () => {
      try {
        // Store the token in memory — all subsequent api requests will send it
        // as Authorization: Bearer <token>
        setAccessToken(token);

        // Fetch CSRF token and user profile in parallel
        await Promise.allSettled([fetchCsrfToken()]);

        // Fetch user details to populate the auth context
        const api = (await import("@/lib/api")).default;
        const res = await api.get("/users/me");
        // Manually update auth context user state
        auth.setUser(res.data.user);

        navigate("/feed", { replace: true });
      } catch (err) {
        console.error("Failed to complete OAuth login:", err);
        setAccessToken(null);
        navigate("/login?error=oauth_failed", { replace: true });
      }
    };

    completeLogin();
  }, []);

  return <AppLoader />;
}