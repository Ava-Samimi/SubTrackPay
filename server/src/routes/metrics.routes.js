import express from "express";
import { pool } from "../db/pool.js";
import fs from "fs";
import path from "path";

import { buildActiveSubscriptionsSnapshotSQL } from "../analytics/sql/activeSubscriptionsSnapshot.js";
import { buildActiveCustomersSnapshotSQL } from "../analytics/sql/activeCustomersSnapshot.js";
import { buildActivePackagesSnapshotSQL } from "../analytics/sql/activePackagesSnapshot.js";
import { buildAvgAmountPaidAssumedSQL } from "../analytics/sql/avgAmountPaidAssumed.js";
import { buildActiveSubscriptionsByPackageSnapshotSQL } from "../analytics/sql/activeSubscriptionsByPackageSnapshot.js";

const router = express.Router();

function parseYears(req) {
  const years = Number(req.query.years ?? 10);
  if (!Number.isFinite(years) || years <= 0 || years > 50) return null;
  return years;
}

/**
 * GET /api/metrics/active-subscriptions?basis=monthly|weekly|yearly&years=10
 */
router.get("/active-subscriptions", async (req, res) => {
  try {
    const basis = req.query.basis ?? "monthly";
    const years = parseYears(req);
    if (years === null) {
      return res.status(400).json({ ok: false, error: "years must be between 1 and 50" });
    }

    const sql = buildActiveSubscriptionsSnapshotSQL(basis, years);
    const result = await pool.query(sql);

    return res.json({
      ok: true,
      basis,
      years,
      rows: result.rows,
    });
  } catch (err) {
    console.error("metrics/active-subscriptions error:", err);
    return res.status(400).json({ ok: false, error: String(err.message || err) });
  }
});

/**
 * GET /api/metrics/active-customers?basis=monthly|weekly|yearly&years=10
 */
router.get("/active-customers", async (req, res) => {
  try {
    const basis = req.query.basis ?? "monthly";
    const years = parseYears(req);
    if (years === null) {
      return res.status(400).json({ ok: false, error: "years must be between 1 and 50" });
    }

    const sql = buildActiveCustomersSnapshotSQL(basis, years);
    const result = await pool.query(sql);

    return res.json({ ok: true, basis, years, rows: result.rows });
  } catch (err) {
    console.error("metrics/active-customers error:", err);
    return res.status(400).json({ ok: false, error: String(err.message || err) });
  }
});

/**
 * GET /api/metrics/active-packages?basis=monthly|weekly|yearly&years=10
 */
router.get("/active-packages", async (req, res) => {
  try {
    const basis = req.query.basis ?? "monthly";
    const years = parseYears(req);
    if (years === null) {
      return res.status(400).json({ ok: false, error: "years must be between 1 and 50" });
    }

    const sql = buildActivePackagesSnapshotSQL(basis, years);
    const result = await pool.query(sql);

    return res.json({
      ok: true,
      basis,
      years,
      rows: result.rows,
    });
  } catch (err) {
    console.error("metrics/active-packages error:", err);
    return res.status(400).json({ ok: false, error: String(err.message || err) });
  }
});

/**
 * GET /api/metrics/avg-amount-paid?basis=monthly|yearly&years=10
 */
router.get("/avg-amount-paid", async (req, res) => {
  try {
    const basis = req.query.basis ?? "monthly";
    const years = parseYears(req);
    if (years === null) {
      return res.status(400).json({ ok: false, error: "years must be between 1 and 50" });
    }

    const sql = buildAvgAmountPaidAssumedSQL(basis, years);
    const result = await pool.query(sql);

    return res.json({ ok: true, basis, years, rows: result.rows });
  } catch (err) {
    console.error("metrics/avg-amount-paid error:", err);
    return res.status(400).json({ ok: false, error: String(err.message || err) });
  }
});

// POST /api/metrics/save-chart-png
router.post("/save-chart-png", async (req, res) => {
  try {
    const { pngDataUrl, filenameHint, title } = req.body || {};

    if (!pngDataUrl || typeof pngDataUrl !== "string") {
      return res.status(400).json({ ok: false, error: "pngDataUrl is required" });
    }

    const m = pngDataUrl.match(/^data:image\/png;base64,(.+)$/);
    if (!m) {
      return res.status(400).json({ ok: false, error: "Invalid PNG data URL" });
    }

    const buf = Buffer.from(m[1], "base64");

    // ✅ Always save to this absolute path INSIDE the container
    // (then mount /app/exports to your host with a docker volume)
    const outDir = "/app/exports/chart_pngs";
    fs.mkdirSync(outDir, { recursive: true });

    const safe = String(filenameHint || title || "chart")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 80);

    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `${safe || "chart"}__${ts}.png`;

    const outPath = path.join(outDir, filename);
    fs.writeFileSync(outPath, buf);

    console.log("✅ saved chart png:", outPath, "bytes:", buf.length);

    return res.json({ ok: true, filename, bytes: buf.length });
  } catch (err) {
    console.error("save-chart-png error:", err);
    return res.status(500).json({ ok: false, error: String(err.message || err) });
  }
});

// GET /api/metrics/chart-pngs
router.get("/chart-pngs", async (req, res) => {
  try {
    const dir = "/app/exports/chart_pngs";
    if (!fs.existsSync(dir)) {
      return res.json({ ok: true, files: [] });
    }

    const names = fs.readdirSync(dir).filter((n) => n.toLowerCase().endsWith(".png"));

    const files = names
      .map((name) => {
        const full = path.join(dir, name);
        const st = fs.statSync(full);
        return {
          name,
          url: `/exports/chart_pngs/${encodeURIComponent(name)}`,
          mtimeMs: st.mtimeMs,
          size: st.size,
        };
      })
      .sort((a, b) => b.mtimeMs - a.mtimeMs); // newest first

    return res.json({ ok: true, files });
  } catch (err) {
    console.error("metrics/chart-pngs error:", err);
    return res.status(500).json({ ok: false, error: String(err.message || err) });
  }
});

router.get("/active-subscriptions-by-package", async (req, res) => {
  try {
    const sql = buildActiveSubscriptionsByPackageSnapshotSQL();
    const result = await pool.query(sql);

    return res.json({
      ok: true,
      rows: result.rows,
    });
  } catch (err) {
    console.error("metrics/active-subscriptions-by-package error:", err);
    return res.status(400).json({ ok: false, error: String(err.message || err) });
  }
});

export default router;
