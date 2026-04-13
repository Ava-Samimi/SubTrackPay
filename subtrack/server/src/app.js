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

const app = express();

app.use(cors());

// must be BEFORE routes, and only once
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Public static files
app.use("/exports", express.static("/app/exports"));
app.use("/snapshots", express.static("/app/client/public/snapshots"));

// Public health check
app.get("/api/health", (req, res) => res.json({ ok: true }));

// Public routes
app.use("/api/analytics", analyticsRoutes);
app.use("/api/data", dataRoutes);
app.use("/api/nightly", nightlyRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/metrics", metricsRoutes);
app.use("/api", seedRoutes);
app.use("/api/customers", customersRouter);
app.use("/api/packages", packagesRouter);
app.use("/api/subscriptions", subscriptionsRouter);
app.use("/api/payments", paymentsRouter);

// Protect everything below this line
if (process.env.NODE_ENV !== "test") {
  app.use("/api", requireFirebaseAuth);
}



export default app;