// server/src/routes/packages.routes.js
import { Router } from "express";
import { prisma } from "../prisma.js";

const router = Router();

function toIntOrNull(value) {
  const n = Number(value);
  return Number.isInteger(n) ? n : null;
}

function toTrimmedStringOrNull(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s ? s : null;
}

function prismaErrorToResponse(err) {
  const code = err?.code;
  if (code === "P2002") {
    return { status: 409, body: { error: "Duplicate value for a unique field", code } };
  }
  if (code === "P2003") {
    return { status: 409, body: { error: "Foreign key constraint failed", code } };
  }
  if (code === "P2025") {
    return { status: 404, body: { error: "Record not found", code } };
  }
  return {
    status: 400,
    body: {
      error: "Request failed",
      code: code || "UNKNOWN",
      detail: err?.message,
    },
  };
}

// LIST
router.get("/", async (_req, res) => {
  try {
    const rows = await prisma.package.findMany({
      orderBy: { packageID: "desc" },
    });
    res.json(rows);
  } catch (err) {
    console.error("GET /packages failed:", err);
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
  } catch (err) {
    console.error("GET /packages/:id failed:", err);
    res.status(500).json({ error: "Failed to fetch package" });
  }
});

// CREATE
router.post("/", async (req, res) => {
  const { name, monthlyCost, annualCost } = req.body ?? {};

  const pkgName = toTrimmedStringOrNull(name);
  const m = toIntOrNull(monthlyCost);
  const a = toIntOrNull(annualCost);

  if (!pkgName) {
    return res.status(400).json({ error: "name is required" });
  }
  if (m === null || m < 0) {
    return res.status(400).json({ error: "monthlyCost must be a non-negative integer" });
  }
  if (a === null || a < 0) {
    return res.status(400).json({ error: "annualCost must be a non-negative integer" });
  }

  try {
    const created = await prisma.package.create({
      data: { name: pkgName, monthlyCost: m, annualCost: a },
    });
    res.status(201).json(created);
  } catch (err) {
    console.error("POST /packages failed:", err);
    const mapped = prismaErrorToResponse(err);
    res.status(mapped.status).json(mapped.body);
  }
});

// UPDATE
router.put("/:id", async (req, res) => {
  const packageID = toIntOrNull(req.params.id);
  if (packageID === null) return res.status(400).json({ error: "Invalid package id" });

  const { name, monthlyCost, annualCost } = req.body ?? {};

  const pkgName = name === undefined ? undefined : toTrimmedStringOrNull(name);
  const m = monthlyCost === undefined ? undefined : toIntOrNull(monthlyCost);
  const a = annualCost === undefined ? undefined : toIntOrNull(annualCost);

  if (pkgName !== undefined && !pkgName) {
    return res.status(400).json({ error: "name cannot be empty" });
  }
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
        name: pkgName, // undefined => unchanged, string => update
        monthlyCost: m,
        annualCost: a,
      },
    });

    res.json(updated);
  } catch (err) {
    console.error("PUT /packages/:id failed:", err);
    const mapped = prismaErrorToResponse(err);
    res.status(mapped.status).json(mapped.body);
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
  } catch (err) {
    console.error("DELETE /packages/:id failed:", err);
    const mapped = prismaErrorToResponse(err);

    // keep friendly message if it's likely "in use"
    if (mapped.body?.code === "P2003") {
      return res
        .status(400)
        .json({ error: "Failed to delete package (it may be in use by subscriptions)", code: "P2003" });
    }

    res.status(mapped.status).json(mapped.body);
  }
});

export default router;
