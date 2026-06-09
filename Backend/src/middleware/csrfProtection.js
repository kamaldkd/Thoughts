import csurf from "csurf";

/**
 * DEPRECATION NOTICE:
 * The `csurf` package is officially deprecated by the Express.js team.
 * We are structuring this middleware export securely to allow for an easy drop-in 
 * replacement (e.g., migrating to `csrf-csrf` or a custom double-submit architecture)
 * in the future without refactoring all route logic.
 */

// Detect production reliably — mirrors the same logic in authController.js
const isProduction = process.env.NODE_ENV === "production" || !!process.env.FRONTEND_URL;

export const csrfProtection = csurf({ 
  cookie: { 
    httpOnly: true, 
    secure: isProduction,
    // SameSite must be 'none' for cross-domain cookie flow (Vercel ↔ Render)
    sameSite: isProduction ? "none" : "lax"
  } 
});

