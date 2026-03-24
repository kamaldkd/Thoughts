import csurf from "csurf";

/**
 * DEPRECATION NOTICE:
 * The `csurf` package is officially deprecated by the Express.js team.
 * We are structuring this middleware export securely to allow for an easy drop-in 
 * replacement (e.g., migrating to `csrf-csrf` or a custom double-submit architecture)
 * in the future without refactoring all route logic.
 */

export const csrfProtection = csurf({ 
  cookie: { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production', 
    // CRITICAL: SameSite must be 'none' in production to allow Vercel <-> Render cross-domain cookie pipelines
    sameSite: process.env.NODE_ENV === 'production' ? "none" : "lax"
  } 
});
