import express from "express";
import cors from "cors";

import customersRouter from "./routes/customers.routes.js";
import packagesRouter from "./routes/packages.routes.js";
import subscriptionsRouter from "./routes/subscriptions.routes.js";
import paymentsRouter from "./routes/payments.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import dataRoutes from "./routes/data.routes.js";
import nightlyRoutes from "./routes/nightly.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import metricsRoutes from "./routes/metrics.routes.js";
import seedRoutes from "./routes/seed.routes.js";

import { requireFirebaseAuth } from "./middleware/requireFirebaseAuth.js";
import { helmet, generalLimiter, strictLimiter } from "./middleware/security.js";
import { createLogger } from "./logger.js";

const log = createLogger("app");
const app = express();

// ── Defensive middleware ──────────────────────────────────────────────────────
// Helmet sets secure HTTP headers (CSP, X-Frame-Options, X-Content-Type-Options,
// Referrer-Policy, etc.) and removes the X-Powered-By fingerprinting header.
app.use(helmet);

// General rate limit: 100 requests per 15 minutes per IP across all API routes
app.use("/api", generalLimiter);

app.use(cors());

// must be BEFORE routes, and only once
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Request logging middleware
app.use((req, _res, next) => {
  log.info(`${req.method} ${req.path}`);
  next();
});

// ── Public static files (no auth required) ──────────────────────────────────
app.use("/exports", express.static("/app/exports"));
app.use("/snapshots", express.static("/app/client/public/snapshots"));

// ── Public endpoints (no auth required) ─────────────────────────────────────
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// ── Auth guard — everything mounted below this line requires a valid Firebase
//    token. In test mode the guard is skipped so tests can run without
//    credentials. ──────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  app.use("/api", requireFirebaseAuth);
}

// ── Protected routes ─────────────────────────────────────────────────────────
app.use("/api/analytics", analyticsRoutes);
app.use("/api/data", dataRoutes);
app.use("/api/nightly", nightlyRoutes);
// Strict rate limit on admin endpoints — they trigger heavy DB operations.
// /api/admin/seed is also matched here since it starts with /api/admin.
app.use("/api/admin", strictLimiter, adminRoutes);
app.use("/api/metrics", metricsRoutes);
app.use("/api", seedRoutes);
app.use("/api/customers", customersRouter);
app.use("/api/packages", packagesRouter);
app.use("/api/subscriptions", subscriptionsRouter);
app.use("/api/payments", paymentsRouter);

// ── Global error handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  log.error("Unhandled error", err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;