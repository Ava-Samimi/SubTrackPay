import { Router } from "express";
import { prisma } from "../prisma.js";

const router = Router();

const STATUSES = new Set(["DUE", "PAID", "FAILED", "VOID"]);

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
    const rows = await prisma.payment.findMany({
      orderBy: { dueDate: "desc" },
      include: {
        subscription: {
          include: { customer: true, package: true },
        },
      },
    });
    res.json(rows);
  } catch (_e) {
    res.status(500).json({ error: "Failed to fetch payments" });
  }
});

// READ ONE
router.get("/:id", async (req, res) => {
  const paymentID = toIntOrNull(req.params.id);
  if (paymentID === null) return res.status(400).json({ error: "Invalid payment id" });

  try {
    const row = await prisma.payment.findUnique({
      where: { paymentID },
      include: {
        subscription: {
          include: { customer: true, package: true },
        },
      },
    });
    if (!row) return res.status(404).json({ error: "Payment not found" });
    res.json(row);
  } catch (_e) {
    res.status(500).json({ error: "Failed to fetch payment" });
  }
});

// CREATE
router.post("/", async (req, res) => {
  const { subscriptionID, dueDate, paidAt, status } = req.body ?? {};

  const sID = toIntOrNull(subscriptionID);
  if (sID === null) return res.status(400).json({ error: "subscriptionID is required and must be an integer" });

  const dd = toDateOrNull(dueDate);
  if (!dd) return res.status(400).json({ error: "dueDate is required and must be a valid date" });

  const pa = paidAt === undefined ? undefined : toDateOrNull(paidAt);
  if (paidAt !== undefined && paidAt !== null && paidAt !== "" && pa === null) {
    return res.status(400).json({ error: "paidAt must be a valid date (or null)" });
  }

  // status is REQUIRED in schema
  if (!status || !STATUSES.has(status)) {
    return res.status(400).json({ error: "status is required and must be DUE, PAID, FAILED, or VOID" });
  }

  try {
    const created = await prisma.payment.create({
      data: {
        subscriptionID: sID,
        dueDate: dd,
        paidAt: paidAt === undefined ? null : pa, // if omitted, default to null
        status,
      },
      include: {
        subscription: {
          include: { customer: true, package: true },
        },
      },
    });

    res.status(201).json(created);
  } catch (_e) {
    res.status(400).json({ error: "Failed to create payment (bad subscriptionID?)" });
  }
});

// UPDATE
router.put("/:id", async (req, res) => {
  const paymentID = toIntOrNull(req.params.id);
  if (paymentID === null) return res.status(400).json({ error: "Invalid payment id" });

  const { dueDate, paidAt, status } = req.body ?? {};

  const dd = dueDate === undefined ? undefined : toDateOrNull(dueDate);
  if (dueDate !== undefined && !dd) {
    return res.status(400).json({ error: "dueDate must be a valid date" });
  }

  const pa = paidAt === undefined ? undefined : toDateOrNull(paidAt);
  if (paidAt !== undefined && paidAt !== null && paidAt !== "" && pa === null) {
    return res.status(400).json({ error: "paidAt must be a valid date (or null)" });
  }

  if (status !== undefined && !STATUSES.has(status)) {
    return res.status(400).json({ error: "status must be DUE, PAID, FAILED, or VOID" });
  }

  try {
    const exists = await prisma.payment.findUnique({ where: { paymentID } });
    if (!exists) return res.status(404).json({ error: "Payment not found" });

    const updated = await prisma.payment.update({
      where: { paymentID },
      data: {
        dueDate: dd,
        paidAt: paidAt === undefined ? undefined : (paidAt ? pa : null),
        status,
      },
      include: {
        subscription: {
          include: { customer: true, package: true },
        },
      },
    });

    res.json(updated);
  } catch (_e) {
    res.status(400).json({ error: "Failed to update payment" });
  }
});

// DELETE
router.delete("/:id", async (req, res) => {
  const paymentID = toIntOrNull(req.params.id);
  if (paymentID === null) return res.status(400).json({ error: "Invalid payment id" });

  try {
    const exists = await prisma.payment.findUnique({ where: { paymentID } });
    if (!exists) return res.status(404).json({ error: "Payment not found" });

    await prisma.payment.delete({ where: { paymentID } });
    res.status(204).send();
  } catch (_e) {
    res.status(400).json({ error: "Failed to delete payment" });
  }
});

export default router;
