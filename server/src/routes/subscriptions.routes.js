import { Router } from "express";
import { prisma } from "../prisma.js";

const router = Router();

const BILLING_CYCLES = new Set(["MONTHLY", "ANNUAL"]);
const STATUSES = new Set(["ACTIVE", "PAUSED", "CANCELED"]);

function toIntOrNull(value) {
  const n = Number(value);
  return Number.isInteger(n) ? n : null;
}

function toDateOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

// LIST
router.get("/", async (_req, res) => {
  try {
    const rows = await prisma.subscription.findMany({
      orderBy: { startDate: "desc" },
      include: {
        customer: true,
        package: true,
      },
    });
    res.json(rows);
  } catch (_e) {
    res.status(500).json({ error: "Failed to fetch subscriptions" });
  }
});

// READ ONE
router.get("/:id", async (req, res) => {
  const subscriptionID = toIntOrNull(req.params.id);
  if (subscriptionID === null) return res.status(400).json({ error: "Invalid subscription id" });

  try {
    const row = await prisma.subscription.findUnique({
      where: { subscriptionID },
      include: {
        customer: true,
        package: true,
        payments: true,
      },
    });
    if (!row) return res.status(404).json({ error: "Subscription not found" });
    res.json(row);
  } catch (_e) {
    res.status(500).json({ error: "Failed to fetch subscription" });
  }
});

// CREATE
router.post("/", async (req, res) => {
  const { customerID, packageID, billingCycle, status, startDate, endDate, price } = req.body ?? {};

  const cID = toIntOrNull(customerID);
  const pID = toIntOrNull(packageID);
  const pr = toIntOrNull(price);

  if (cID === null) return res.status(400).json({ error: "customerID is required and must be an integer" });
  if (pID === null) return res.status(400).json({ error: "packageID is required and must be an integer" });

  if (!billingCycle || !BILLING_CYCLES.has(billingCycle)) {
    return res.status(400).json({ error: "billingCycle must be MONTHLY or ANNUAL" });
  }
  // status is REQUIRED in schema
  if (!status || !STATUSES.has(status)) {
    return res.status(400).json({ error: "status is required and must be ACTIVE, PAUSED, or CANCELED" });
  }
  if (pr === null || pr < 0) {
    return res.status(400).json({ error: "price must be a non-negative integer" });
  }

  const sd = startDate === undefined ? undefined : toDateOrNull(startDate);
  if (startDate !== undefined && startDate !== null && startDate !== "" && sd === null) {
    return res.status(400).json({ error: "startDate must be a valid date (or omit it)" });
  }

  const ed = endDate === undefined ? undefined : toDateOrNull(endDate);
  if (endDate !== undefined && endDate !== null && endDate !== "" && ed === null) {
    return res.status(400).json({ error: "endDate must be a valid date (or null)" });
  }

  try {
    const created = await prisma.subscription.create({
      data: {
        customerID: cID,
        packageID: pID,
        billingCycle,
        status,
        startDate: sd === undefined ? undefined : sd, // omit => default(now())
        endDate: ed === undefined ? undefined : ed,   // omit or null ok
        price: pr,
      },
      include: {
        customer: true,
        package: true,
      },
    });

    res.status(201).json(created);
  } catch (_e) {
    res.status(400).json({
      error: "Failed to create subscription (bad customerID/packageID?)",
    });
  }
});

// UPDATE
router.put("/:id", async (req, res) => {
  const subscriptionID = toIntOrNull(req.params.id);
  if (subscriptionID === null) return res.status(400).json({ error: "Invalid subscription id" });

  const { billingCycle, status, startDate, endDate, price } = req.body ?? {};

  if (billingCycle !== undefined && !BILLING_CYCLES.has(billingCycle)) {
    return res.status(400).json({ error: "billingCycle must be MONTHLY or ANNUAL" });
  }
  if (status !== undefined && !STATUSES.has(status)) {
    return res.status(400).json({ error: "status must be ACTIVE, PAUSED, or CANCELED" });
  }

  const pr = price === undefined ? undefined : toIntOrNull(price);
  if (pr !== undefined && (pr === null || pr < 0)) {
    return res.status(400).json({ error: "price must be a non-negative integer" });
  }

  const sd = startDate === undefined ? undefined : toDateOrNull(startDate);
  if (startDate !== undefined && startDate !== null && startDate !== "" && sd === null) {
    return res.status(400).json({ error: "startDate must be a valid date (or null)" });
  }

  const ed = endDate === undefined ? undefined : toDateOrNull(endDate);
  if (endDate !== undefined && endDate !== null && endDate !== "" && ed === null) {
    return res.status(400).json({ error: "endDate must be a valid date (or null)" });
  }

  try {
    const exists = await prisma.subscription.findUnique({ where: { subscriptionID } });
    if (!exists) return res.status(404).json({ error: "Subscription not found" });

    const updated = await prisma.subscription.update({
      where: { subscriptionID },
      data: {
        billingCycle,
        status,
        startDate: startDate === undefined ? undefined : sd, // allow null? schema is DateTime default now; keep as Date
        endDate: endDate === undefined ? undefined : ed,     // allow null to clear
        price: pr,
      },
      include: {
        customer: true,
        package: true,
      },
    });

    res.json(updated);
  } catch (_e) {
    res.status(400).json({ error: "Failed to update subscription" });
  }
});

// DELETE
router.delete("/:id", async (req, res) => {
  const subscriptionID = toIntOrNull(req.params.id);
  if (subscriptionID === null) return res.status(400).json({ error: "Invalid subscription id" });

  try {
    const exists = await prisma.subscription.findUnique({ where: { subscriptionID } });
    if (!exists) return res.status(404).json({ error: "Subscription not found" });

    await prisma.subscription.delete({ where: { subscriptionID } });
    res.status(204).send();
  } catch (_e) {
    res.status(400).json({ error: "Failed to delete subscription" });
  }
});

export default router;
