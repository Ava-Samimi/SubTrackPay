/**
 * server/src/middleware/security.js
 *
 * Defensive middleware layer applied globally in app.js.
 *
 * Provides:
 *   - Security headers via helmet (removes fingerprinting headers, sets
 *     Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, etc.)
 *   - Rate limiting via express-rate-limit (100 req / 15 min per IP on the
 *     general API, 10 req / 15 min per IP on the auth-sensitive seed endpoint)
 *
 * Both packages are loaded with a graceful fallback so the server still starts
 * in environments where node_modules have not been installed yet (e.g. during
 * local development before `npm ci`).
 */

import { createLogger } from "../logger.js";

const log = createLogger("middleware.security");

// ── Helmet ────────────────────────────────────────────────────────────────────

let helmetMiddleware;

try {
  const { default: helmet } = await import("helmet");
  helmetMiddleware = helmet();
  log.info("Helmet security headers enabled");
} catch {
  log.warn("helmet package not found — security headers not applied. Run npm ci.");
  helmetMiddleware = (_req, _res, next) => next();
}

export { helmetMiddleware as helmet };

// ── Rate limiting ─────────────────────────────────────────────────────────────

let generalLimiter;
let strictLimiter;

try {
  const { rateLimit } = await import("express-rate-limit");

  // General API limit: 100 requests per 15 minutes per IP
  generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,  // Return rate limit info in RateLimit-* headers
    legacyHeaders: false,
    message: { error: "Too many requests. Please try again later." },
    handler(req, res, _next, options) {
      log.warn("Rate limit exceeded", { ip: req.ip, path: req.path });
      res.status(429).json(options.message);
    },
  });

  // Strict limit for sensitive write operations: 10 requests per 15 minutes per IP
  strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests to this endpoint. Please try again later." },
    handler(req, res, _next, options) {
      log.warn("Strict rate limit exceeded", { ip: req.ip, path: req.path });
      res.status(429).json(options.message);
    },
  });

  log.info("Rate limiting enabled", { generalMax: 100, strictMax: 10, windowMinutes: 15 });
} catch {
  log.warn("express-rate-limit package not found — rate limiting not applied. Run npm ci.");
  const passThrough = (_req, _res, next) => next();
  generalLimiter = passThrough;
  strictLimiter = passThrough;
}

export { generalLimiter, strictLimiter };
