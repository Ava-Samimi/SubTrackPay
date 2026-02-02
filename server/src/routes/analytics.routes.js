// server/src/routes/analytics.routes.js
import express from "express";
import { PrismaClient } from "@prisma/client";

// ✅ NEW: shared SQL builder + pool (moved out of nightly.routes.js)
import { pool, buildSql } from "../analytics/sqlBuilder.js";

const router = express.Router();
const prisma = new PrismaClient();

/**
 * ✅ POST /api/analytics/run
 * Runs a recipe immediately and returns rows (and SQL for debugging).
 *
 * Body: { recipeId, querySpec, chartKey, sentence }
 * Returns:
 *  {
 *    ok: true,
 *    recipeId,
 *    chartKey,
 *    sentence,
 *    querySpec,
 *    sql,
 *    rows: [...]
 *  }
 */
router.post("/run", async (req, res) => {
  try {
    const { recipeId, querySpec, chartKey, sentence } = req.body || {};

    if (!recipeId || !String(recipeId).trim()) {
      return res.status(400).json({ ok: false, error: "recipeId is required" });
    }
    if (!querySpec || typeof querySpec !== "object") {
      return res.status(400).json({ ok: false, error: "querySpec is required" });
    }

    const sql = buildSql(querySpec);
    const result = await pool.query(sql);

    return res.json({
      ok: true,
      recipeId: String(recipeId).trim(),
      chartKey: chartKey || querySpec?.chartKey || "bar",
      sentence: sentence || "",
      querySpec,
      sql,
      rows: result?.rows || [],
    });
  } catch (e) {
    console.error("POST /api/analytics/run error:", e);
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

// GET /api/analytics  -> list AnalyticsDefinition rows
router.get("/", async (req, res) => {
  try {
    const rows = await prisma.analyticsDefinition.findMany({
      orderBy: { analyticsID: "desc" },
    });
    res.json(rows);
  } catch (e) {
    console.error("GET /api/analytics error:", e);
    res.status(500).json({ error: "Failed to list analytics definitions" });
  }
});

// GET /api/analytics/:id  -> read one
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

  try {
    const row = await prisma.analyticsDefinition.findUnique({
      where: { analyticsID: id },
    });

    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (e) {
    console.error("GET /api/analytics/:id error:", e);
    res.status(500).json({ error: "Failed to read analytics definition" });
  }
});

// POST /api/analytics  -> create
router.post("/", async (req, res) => {
  const { analyticsName, analyticsDescription, nameOfJSONFile } = req.body || {};

  if (!analyticsName || !String(analyticsName).trim()) {
    return res.status(400).json({ error: "analyticsName is required" });
  }
  if (!nameOfJSONFile || !String(nameOfJSONFile).trim()) {
    return res.status(400).json({ error: "nameOfJSONFile is required" });
  }

  try {
    const created = await prisma.analyticsDefinition.create({
      data: {
        analyticsName: String(analyticsName).trim(),
        analyticsDescription:
          analyticsDescription && String(analyticsDescription).trim()
            ? String(analyticsDescription).trim()
            : null,
        nameOfJSONFile: String(nameOfJSONFile).trim(),
      },
    });

    res.status(201).json(created);
  } catch (e) {
    console.error("POST /api/analytics error:", e);
    res.status(500).json({ error: "Failed to create analytics definition" });
  }
});

// PUT /api/analytics/:id  -> update
router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

  const { analyticsName, analyticsDescription, nameOfJSONFile } = req.body || {};

  if (!analyticsName || !String(analyticsName).trim()) {
    return res.status(400).json({ error: "analyticsName is required" });
  }
  if (!nameOfJSONFile || !String(nameOfJSONFile).trim()) {
    return res.status(400).json({ error: "nameOfJSONFile is required" });
  }

  try {
    const updated = await prisma.analyticsDefinition.update({
      where: { analyticsID: id },
      data: {
        analyticsName: String(analyticsName).trim(),
        analyticsDescription:
          analyticsDescription && String(analyticsDescription).trim()
            ? String(analyticsDescription).trim()
            : null,
        nameOfJSONFile: String(nameOfJSONFile).trim(),
      },
    });

    res.json(updated);
  } catch (e) {
    // Prisma throws if not found
    if (String(e?.code) === "P2025") {
      return res.status(404).json({ error: "Not found" });
    }
    console.error("PUT /api/analytics/:id error:", e);
    res.status(500).json({ error: "Failed to update analytics definition" });
  }
});

// DELETE /api/analytics/:id  -> delete
router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

  try {
    await prisma.analyticsDefinition.delete({
      where: { analyticsID: id },
    });

    res.status(204).send();
  } catch (e) {
    if (String(e?.code) === "P2025") {
      return res.status(404).json({ error: "Not found" });
    }
    console.error("DELETE /api/analytics/:id error:", e);
    res.status(500).json({ error: "Failed to delete analytics definition" });
  }
});

export default router;
