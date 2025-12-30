import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import customersRouter from "./routes/customers.routes.js";
import packagesRouter from "./routes/packages.routes.js";
import subscriptionsRouter from "./routes/subscriptions.routes.js";
import paymentsRouter from "./routes/payments.routes.js";


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use("/api/packages", packagesRouter);
app.use("/api/subscriptions", subscriptionsRouter);
app.use("/api/payments", paymentsRouter);


app.use("/api/customers", customersRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
