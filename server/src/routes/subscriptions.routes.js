import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

const BILLING_CYCLES = new Set(["MONTHLY", "ANNUAL"]);
const STATUSES = new Set(["ACTIVE", "PAUSED", "CANCELED"]);

// LIST
router.get("/", async (req, res) => {
  try {
    const rows = await prisma.subscription.findMany({
      orderBy: { startDate: "desc" },
    });
    res.json(rows);
  } catch {
    res.status(500).json({ error: "Failed to fetch subscriptions" });
  }
});

// READ ONE
router.get("/:id", async (req, res) => {
  try {
    const row = await prisma.subscription.findUnique({ where: { id: req.params.id } });
    if (!row) return res.status(404).json({ error: "Subscription not found" });
    res.json(row);
  } catch {
    res.status(500).json({ error: "Failed to fetch subscription" });
  }
});

// CREATE
router.post("/", async (req, res) => {
  const {
    customerId,
    packageId,
    billingCycle,
    status,
    startDate,
    endDate,
    priceCents,
  } = req.body ?? {};

  if (!customerId || typeof customerId !== "string") {
    return res.status(400).json({ error: "customerId is required" });
  }
  if (!packageId || typeof packageId !== "string") {
    return res.status(400).json({ error: "packageId is required" });
  }
  if (!billingCycle || !BILLING_CYCLES.has(billingCycle)) {
    return res.status(400).json({ error: "billingCycle must be MONTHLY or ANNUAL" });
  }
  if (status !== undefined && !STATUSES.has(status)) {
    return res.status(400).json({ error: "status must be ACTIVE, PAUSED, or CANCELED" });
  }
  if (!Number.isInteger(priceCents) || priceCents < 0) {
    return res.status(400).json({ error: "priceCents must be a non-negative integer" });
  }

  try {
    const created = await prisma.subscription.create({
      data: {
        customerId,
        packageId,
        billingCycle,
        status: status ?? undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : null,
        priceCents,
      },
    });
    res.status(201).json(created);
  } catch {
    // could be: invalid FK, or @@unique([customerId, packageId]) violation
    res.status(400).json({ error: "Failed to create subscription (bad IDs or duplicate customer+package)" });
  }
});

// UPDATE
router.put("/:id", async (req, res) => {
  const { billingCycle, status, startDate, endDate, priceCents } = req.body ?? {};

  if (billingCycle !== undefined && !BILLING_CYCLES.has(billingCycle)) {
    return res.status(400).json({ error: "billingCycle must be MONTHLY or ANNUAL" });
  }
  if (status !== undefined && !STATUSES.has(status)) {
    return res.status(400).json({ error: "status must be ACTIVE, PAUSED, or CANCELED" });
  }
  if (priceCents !== undefined && (!Number.isInteger(priceCents) || priceCents < 0)) {
    return res.status(400).json({ error: "priceCents must be a non-negative integer" });
  }

  try {
    const exists = await prisma.subscription.findUnique({ where: { id: req.params.id } });
    if (!exists) return res.status(404).json({ error: "Subscription not found" });

    const updated = await prisma.subscription.update({
      where: { id: req.params.id },
      data: {
        billingCycle,
        status,
        startDate: startDate !== undefined ? (startDate ? new Date(startDate) : undefined) : undefined,
        endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : undefined,
        priceCents,
      },
    });
    res.json(updated);
  } catch {
    res.status(400).json({ error: "Failed to update subscription" });
  }
});

// DELETE
router.delete("/:id", async (req, res) => {
  try {
    const exists = await prisma.subscription.findUnique({ where: { id: req.params.id } });
    if (!exists) return res.status(404).json({ error: "Subscription not found" });

    await prisma.subscription.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(400).json({ error: "Failed to delete subscription" });
  }
});

export default router;
