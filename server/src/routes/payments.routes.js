import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

const STATUSES = new Set(["DUE", "PAID", "FAILED", "VOID"]);

// LIST
router.get("/", async (req, res) => {
  try {
    const rows = await prisma.payment.findMany({ orderBy: { dueDate: "desc" } });
    res.json(rows);
  } catch {
    res.status(500).json({ error: "Failed to fetch payments" });
  }
});

// READ ONE
router.get("/:id", async (req, res) => {
  try {
    const row = await prisma.payment.findUnique({ where: { id: req.params.id } });
    if (!row) return res.status(404).json({ error: "Payment not found" });
    res.json(row);
  } catch {
    res.status(500).json({ error: "Failed to fetch payment" });
  }
});

// CREATE
router.post("/", async (req, res) => {
  const {
    subscriptionId,
    amountCents,
    dueDate,
    paidAt,
    status,
    periodStart,
    periodEnd,
  } = req.body ?? {};

  if (!subscriptionId || typeof subscriptionId !== "string") {
    return res.status(400).json({ error: "subscriptionId is required" });
  }
  if (!Number.isInteger(amountCents) || amountCents < 0) {
    return res.status(400).json({ error: "amountCents must be a non-negative integer" });
  }
  if (!dueDate) return res.status(400).json({ error: "dueDate is required" });
  if (!periodStart) return res.status(400).json({ error: "periodStart is required" });
  if (!periodEnd) return res.status(400).json({ error: "periodEnd is required" });
  if (status !== undefined && !STATUSES.has(status)) {
    return res.status(400).json({ error: "status must be DUE, PAID, FAILED, or VOID" });
  }

  try {
    const created = await prisma.payment.create({
      data: {
        subscriptionId,
        amountCents,
        dueDate: new Date(dueDate),
        paidAt: paidAt ? new Date(paidAt) : null,
        status: status ?? undefined,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
      },
    });
    res.status(201).json(created);
  } catch {
    // could be: invalid FK, or @@unique([subscriptionId, periodStart, periodEnd]) violation
    res.status(400).json({ error: "Failed to create payment (bad subscriptionId or duplicate period)" });
  }
});

// UPDATE
router.put("/:id", async (req, res) => {
  const { amountCents, dueDate, paidAt, status, periodStart, periodEnd } = req.body ?? {};

  if (amountCents !== undefined && (!Number.isInteger(amountCents) || amountCents < 0)) {
    return res.status(400).json({ error: "amountCents must be a non-negative integer" });
  }
  if (status !== undefined && !STATUSES.has(status)) {
    return res.status(400).json({ error: "status must be DUE, PAID, FAILED, or VOID" });
  }

  try {
    const exists = await prisma.payment.findUnique({ where: { id: req.params.id } });
    if (!exists) return res.status(404).json({ error: "Payment not found" });

    const updated = await prisma.payment.update({
      where: { id: req.params.id },
      data: {
        amountCents,
        dueDate: dueDate !== undefined ? new Date(dueDate) : undefined,
        paidAt: paidAt !== undefined ? (paidAt ? new Date(paidAt) : null) : undefined,
        status,
        periodStart: periodStart !== undefined ? new Date(periodStart) : undefined,
        periodEnd: periodEnd !== undefined ? new Date(periodEnd) : undefined,
      },
    });
    res.json(updated);
  } catch {
    res.status(400).json({ error: "Failed to update payment" });
  }
});

// DELETE
router.delete("/:id", async (req, res) => {
  try {
    const exists = await prisma.payment.findUnique({ where: { id: req.params.id } });
    if (!exists) return res.status(404).json({ error: "Payment not found" });

    await prisma.payment.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(400).json({ error: "Failed to delete payment" });
  }
});

export default router;
