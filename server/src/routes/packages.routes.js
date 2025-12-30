import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

// LIST
router.get("/", async (req, res) => {
  try {
    const rows = await prisma.package.findMany({ orderBy: { createdAt: "desc" } });
    res.json(rows);
  } catch {
    res.status(500).json({ error: "Failed to fetch packages" });
  }
});

// READ ONE
router.get("/:id", async (req, res) => {
  try {
    const row = await prisma.package.findUnique({ where: { id: req.params.id } });
    if (!row) return res.status(404).json({ error: "Package not found" });
    res.json(row);
  } catch {
    res.status(500).json({ error: "Failed to fetch package" });
  }
});

// CREATE
router.post("/", async (req, res) => {
  const { name, monthlyPrice, annualPrice } = req.body ?? {};
  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "name is required" });
  }
  if (!Number.isInteger(monthlyPrice) || monthlyPrice < 0) {
    return res.status(400).json({ error: "monthlyPrice must be a non-negative integer" });
  }
  if (!Number.isInteger(annualPrice) || annualPrice < 0) {
    return res.status(400).json({ error: "annualPrice must be a non-negative integer" });
  }

  try {
    const created = await prisma.package.create({
      data: { name: name.trim(), monthlyPrice, annualPrice },
    });
    res.status(201).json(created);
  } catch {
    res.status(400).json({ error: "Failed to create package (maybe duplicate name)" });
  }
});

// UPDATE
router.put("/:id", async (req, res) => {
  const { name, monthlyPrice, annualPrice } = req.body ?? {};

  if (name !== undefined && (typeof name !== "string" || !name.trim())) {
    return res.status(400).json({ error: "name cannot be empty" });
  }
  if (monthlyPrice !== undefined && (!Number.isInteger(monthlyPrice) || monthlyPrice < 0)) {
    return res.status(400).json({ error: "monthlyPrice must be a non-negative integer" });
  }
  if (annualPrice !== undefined && (!Number.isInteger(annualPrice) || annualPrice < 0)) {
    return res.status(400).json({ error: "annualPrice must be a non-negative integer" });
  }

  try {
    const exists = await prisma.package.findUnique({ where: { id: req.params.id } });
    if (!exists) return res.status(404).json({ error: "Package not found" });

    const updated = await prisma.package.update({
      where: { id: req.params.id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        monthlyPrice,
        annualPrice,
      },
    });
    res.json(updated);
  } catch {
    res.status(400).json({ error: "Failed to update package (maybe duplicate name)" });
  }
});

// DELETE
router.delete("/:id", async (req, res) => {
  try {
    const exists = await prisma.package.findUnique({ where: { id: req.params.id } });
    if (!exists) return res.status(404).json({ error: "Package not found" });

    await prisma.package.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(400).json({ error: "Failed to delete package" });
  }
});

export default router;
