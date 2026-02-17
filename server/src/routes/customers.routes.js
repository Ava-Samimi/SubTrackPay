// server/src/routes/customers.routes.js
import { Router } from "express";
import { prisma } from "../prisma.js";

const router = Router();

// Helpers
function toIntOrNull(value) {
  const n = Number(value);
  return Number.isInteger(n) ? n : null;
}

function toDateOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toTrimmedStringOrNull(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s ? s : null;
}

function prismaErrorToResponse(err) {
  const code = err?.code;
  // Prisma known errors: https://www.prisma.io/docs/orm/reference/error-reference
  if (code === "P2002") {
    // Unique constraint failed
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

// GET /api/customers (list)
router.get("/", async (_req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(customers);
  } catch (err) {
    console.error("GET /customers failed:", err);
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});

// GET /api/customers/:id (read one)
router.get("/:id", async (req, res) => {
  const customerID = toIntOrNull(req.params.id);
  if (customerID === null) return res.status(400).json({ error: "Invalid customer id" });

  try {
    const customer = await prisma.customer.findUnique({ where: { customerID } });
    if (!customer) return res.status(404).json({ error: "Customer not found" });
    res.json(customer);
  } catch (err) {
    console.error("GET /customers/:id failed:", err);
    res.status(500).json({ error: "Failed to fetch customer" });
  }
});

// POST /api/customers (create)
router.post("/", async (req, res) => {
  const { firstName, lastName, email, postalCode, ccExpiration } = req.body ?? {};

  if (!firstName || typeof firstName !== "string" || !firstName.trim()) {
    return res.status(400).json({ error: "firstName is required" });
  }
  if (!lastName || typeof lastName !== "string" || !lastName.trim()) {
    return res.status(400).json({ error: "lastName is required" });
  }
  if (!postalCode || typeof postalCode !== "string" || !postalCode.trim()) {
    return res.status(400).json({ error: "postalCode is required" });
  }

  const ccExpDate = toDateOrNull(ccExpiration);
  if (ccExpiration !== undefined && ccExpiration !== null && ccExpiration !== "" && !ccExpDate) {
    return res.status(400).json({ error: "ccExpiration must be a valid date (or null)" });
  }

  try {
    const created = await prisma.customer.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: toTrimmedStringOrNull(email), // null if blank/whitespace
        postalCode: postalCode.trim(),
        ccExpiration: ccExpDate,
      },
    });
    res.status(201).json(created);
  } catch (err) {
    console.error("POST /customers failed:", err);
    const mapped = prismaErrorToResponse(err);
    res.status(mapped.status).json(mapped.body);
  }
});

// PUT /api/customers/:id (update)
router.put("/:id", async (req, res) => {
  const customerID = toIntOrNull(req.params.id);
  if (customerID === null) return res.status(400).json({ error: "Invalid customer id" });

  const { firstName, lastName, email, postalCode, ccExpiration } = req.body ?? {};

  if (firstName !== undefined && (typeof firstName !== "string" || !firstName.trim())) {
    return res.status(400).json({ error: "firstName cannot be empty" });
  }
  if (lastName !== undefined && (typeof lastName !== "string" || !lastName.trim())) {
    return res.status(400).json({ error: "lastName cannot be empty" });
  }
  if (postalCode !== undefined && (typeof postalCode !== "string" || !postalCode.trim())) {
    return res.status(400).json({ error: "postalCode cannot be empty" });
  }

  const ccExpDate = ccExpiration === undefined ? undefined : toDateOrNull(ccExpiration);
  if (ccExpiration !== undefined && ccExpiration !== null && ccExpiration !== "" && ccExpDate === null) {
    return res.status(400).json({ error: "ccExpiration must be a valid date (or null)" });
  }

  try {
    const exists = await prisma.customer.findUnique({ where: { customerID } });
    if (!exists) return res.status(404).json({ error: "Customer not found" });

    const updated = await prisma.customer.update({
      where: { customerID },
      data: {
        firstName: firstName !== undefined ? firstName.trim() : undefined,
        lastName: lastName !== undefined ? lastName.trim() : undefined,
        email: email !== undefined ? toTrimmedStringOrNull(email) : undefined,
        postalCode: postalCode !== undefined ? postalCode.trim() : undefined,
        ccExpiration: ccExpiration === undefined ? undefined : ccExpDate,
      },
    });

    res.json(updated);
  } catch (err) {
    console.error("PUT /customers/:id failed:", err);
    const mapped = prismaErrorToResponse(err);
    res.status(mapped.status).json(mapped.body);
  }
});

// DELETE /api/customers/:id (delete)
router.delete("/:id", async (req, res) => {
  const customerID = toIntOrNull(req.params.id);
  if (customerID === null) return res.status(400).json({ error: "Invalid customer id" });

  try {
    const exists = await prisma.customer.findUnique({ where: { customerID } });
    if (!exists) return res.status(404).json({ error: "Customer not found" });

    await prisma.customer.delete({ where: { customerID } });
    res.status(204).send();
  } catch (err) {
    console.error("DELETE /customers/:id failed:", err);
    const mapped = prismaErrorToResponse(err);
    res.status(mapped.status).json(mapped.body);
  }
});

export default router;
