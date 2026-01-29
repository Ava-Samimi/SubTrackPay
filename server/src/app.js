import express from "express";
import cors from "cors";

import customersRouter from "./routes/customers.routes.js";
import packagesRouter from "./routes/packages.routes.js";
import subscriptionsRouter from "./routes/subscriptions.routes.js";
import paymentsRouter from "./routes/payments.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";

import { requireFirebaseAuth } from "./middleware/requireFirebaseAuth.js";

const app = express();

app.use(cors());
app.use(express.json());

// Public health check (no auth)
app.get("/api/health", (req, res) => res.json({ ok: true }));

// ✅ PUBLIC (no auth) — for now while you build it
app.use("/api/analytics", analyticsRoutes);

// Protect everything below this line
app.use("/api", requireFirebaseAuth);

app.use("/api/customers", customersRouter);
app.use("/api/packages", packagesRouter);
app.use("/api/subscriptions", subscriptionsRouter);
app.use("/api/payments", paymentsRouter);

// (Optional) later you can re-protect analytics by moving it below auth
// app.use("/api/analytics", analyticsRoutes);

export default app;
