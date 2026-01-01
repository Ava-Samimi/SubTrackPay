import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

// GET /api/customers  (list)
router.get("/", async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(customers);
  } catch (_e) {
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});

// GET /api/customers/:id  (read one)
router.get("/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) return res.status(404).json({ error: "Customer not found" });
    res.json(customer);
  } catch (_e) {
    res.status(500).json({ error: "Failed to fetch customer" });
  }
});

// POST /api/customers  (create)
router.post("/", async (req, res) => {
  const { name, email, phone, notes } = req.body ?? {};

  // If your schema has name required: enforce it
  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "name is required" });
  }

  try {
    const created = await prisma.customer.create({
      data: {
        name: name.trim(),
        email: email ? String(email).trim() : null,
        phone: phone ? String(phone).trim() : null,
        notes: notes ? String(notes).trim() : null,
      },
    });

    res.status(201).json(created);
  } catch (_e) {
    // common: unique email violation
    res.status(400).json({ error: "Failed to create customer (maybe duplicate email)" });
  }
});

// PUT /api/customers/:id  (update)
router.put("/:id", async (req, res) => {
  const id = req.params.id;
  const { name, email, phone, notes } = req.body ?? {};

  if (name !== undefined && (typeof name !== "string" || !name.trim())) {
    return res.status(400).json({ error: "name cannot be empty" });
  }

  try {
    const exists = await prisma.customer.findUnique({ where: { id } });
    if (!exists) return res.status(404).json({ error: "Customer not found" });

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        email: email !== undefined ? (email ? String(email).trim() : null) : undefined,
        phone: phone !== undefined ? (phone ? String(phone).trim() : null) : undefined,
        notes: notes !== undefined ? (notes ? String(notes).trim() : null) : undefined,
      },
    });

    res.json(updated);
  } catch (_e) {
    res.status(400).json({ error: "Failed to update customer (maybe duplicate email)" });
  }
});

// DELETE /api/customers/:id  (delete)
router.delete("/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const exists = await prisma.customer.findUnique({ where: { id } });
    if (!exists) return res.status(404).json({ error: "Customer not found" });

    await prisma.customer.delete({ where: { id } });
    res.status(204).send();
  } catch (_e) {
    res.status(400).json({ error: "Failed to delete customer" });
  }
});

export default router;
