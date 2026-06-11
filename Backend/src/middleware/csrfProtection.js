import csurf from "csurf";

/**
 * DEPRECATION NOTICE:
 * The `csurf` package is officially deprecated by the Express.js team.
 * We are structuring this middleware export securely to allow for an easy drop-in 
 * replacement (e.g., migrating to `csrf-csrf` or a custom double-submit architecture)
 * in the future without refactoring all route logic.
 */

// Detect production environment reliably.
// Render.com automatically injects RENDER=true into every deployment — no manual config needed.
// We intentionally do NOT use !!process.env.FRONTEND_URL because that var also exists in the
// local .env file (for OAuth dev config), which would make isProduction=true locally and
// set secure:true on the CSRF cookie — silently breaking login over HTTP.
const isProduction = process.env.RENDER === "true" || process.env.NODE_ENV === "production";

export const csrfProtection = csurf({ 
  cookie: { 
    httpOnly: true, 
    secure: isProduction,
    // SameSite must be 'none' for cross-domain cookie flow (Vercel ↔ Render)
    sameSite: isProduction ? "none" : "lax"
  } 
});

