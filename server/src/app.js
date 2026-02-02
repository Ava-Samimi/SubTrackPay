import express from "express";
import cors from "cors";

import customersRouter from "./routes/customers.routes.js";
import packagesRouter from "./routes/packages.routes.js";
import subscriptionsRouter from "./routes/subscriptions.routes.js";
import paymentsRouter from "./routes/payments.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import dataRoutes from "./routes/data.routes.js"; // ✅ NEW
import nightlyRoutes from "./routes/nightly.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import metricsRoutes from "./routes/metrics.routes.js";
import path from "path";


import { requireFirebaseAuth } from "./middleware/requireFirebaseAuth.js";

const app = express();

app.use(cors());

// ✅ IMPORTANT: must be BEFORE routes, and only once
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Public health check (no auth)
app.get("/api/health", (req, res) => res.json({ ok: true }));

// ✅ PUBLIC (no auth) — for demo / charts
app.use("/api/analytics", analyticsRoutes);
app.use("/api/data", dataRoutes); // ✅ NEW
app.use("/api/nightly", nightlyRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/metrics", metricsRoutes);
app.use("/exports", express.static("/app/exports"));


// Protect everything below this line
app.use("/api", requireFirebaseAuth);

app.use("/api/customers", customersRouter);
app.use("/api/packages", packagesRouter);
app.use("/api/subscriptions", subscriptionsRouter);
app.use("/api/payments", paymentsRouter);

// (Optional) later you can re-protect analytics by moving it below auth
// app.use("/api/analytics", analyticsRoutes);

export default app;
