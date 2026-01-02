import { Router } from "express";
import { prisma } from "../prisma.js";

const router = Router();

function toIntOrNull(value) {
  const n = Number(value);
  return Number.isInteger(n) ? n : null;
}

// LIST
router.get("/", async (_req, res) => {
  try {
    // No createdAt in Package model anymore, so order by primary key desc.
    const rows = await prisma.package.findMany({
      orderBy: { packageID: "desc" },
    });
    res.json(rows);
  } catch (_e) {
    res.status(500).json({ error: "Failed to fetch packages" });
  }
});

// READ ONE
router.get("/:id", async (req, res) => {
  const packageID = toIntOrNull(req.params.id);
  if (packageID === null) return res.status(400).json({ error: "Invalid package id" });

  try {
    const row = await prisma.package.findUnique({ where: { packageID } });
    if (!row) return res.status(404).json({ error: "Package not found" });
    res.json(row);
  } catch (_e) {
    res.status(500).json({ error: "Failed to fetch package" });
  }
});

// CREATE
router.post("/", async (req, res) => {
  const { monthlyCost, annualCost } = req.body ?? {};

  const m = toIntOrNull(monthlyCost);
  const a = toIntOrNull(annualCost);

  if (m === null || m < 0) {
    return res.status(400).json({ error: "monthlyCost must be a non-negative integer" });
  }
  if (a === null || a < 0) {
    return res.status(400).json({ error: "annualCost must be a non-negative integer" });
  }

  try {
    const created = await prisma.package.create({
      data: { monthlyCost: m, annualCost: a },
    });
    res.status(201).json(created);
  } catch (_e) {
    res.status(400).json({ error: "Failed to create package" });
  }
});

// UPDATE
router.put("/:id", async (req, res) => {
  const packageID = toIntOrNull(req.params.id);
  if (packageID === null) return res.status(400).json({ error: "Invalid package id" });

  const { monthlyCost, annualCost } = req.body ?? {};

  const m = monthlyCost === undefined ? undefined : toIntOrNull(monthlyCost);
  const a = annualCost === undefined ? undefined : toIntOrNull(annualCost);

  if (m !== undefined && (m === null || m < 0)) {
    return res.status(400).json({ error: "monthlyCost must be a non-negative integer" });
  }
  if (a !== undefined && (a === null || a < 0)) {
    return res.status(400).json({ error: "annualCost must be a non-negative integer" });
  }

  try {
    const exists = await prisma.package.findUnique({ where: { packageID } });
    if (!exists) return res.status(404).json({ error: "Package not found" });

    const updated = await prisma.package.update({
      where: { packageID },
      data: {
        monthlyCost: m,
        annualCost: a,
      },
    });

    res.json(updated);
  } catch (_e) {
    res.status(400).json({ error: "Failed to update package" });
  }
});

// DELETE
router.delete("/:id", async (req, res) => {
  const packageID = toIntOrNull(req.params.id);
  if (packageID === null) return res.status(400).json({ error: "Invalid package id" });

  try {
    const exists = await prisma.package.findUnique({ where: { packageID } });
    if (!exists) return res.status(404).json({ error: "Package not found" });

    await prisma.package.delete({ where: { packageID } });
    res.status(204).send();
  } catch (_e) {
    // If package is referenced by subscriptions, Prisma will throw (onDelete: Restrict)
    res.status(400).json({ error: "Failed to delete package (it may be in use by subscriptions)" });
  }
});

export default router;
