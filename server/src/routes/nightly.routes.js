// server/src/routes/nightly.routes.js
import express from "express";
import fs from "fs";
import path from "path";

import { pool, buildSql } from "../analytics/sqlBuilder.js";

const router = express.Router();

const DATA_DIR = path.resolve(process.env.DATA_DIR || "/app/data");
const DBINFO_DIR = path.join(DATA_DIR, "db-info");
const SCHEMA_FILE = path.join(DBINFO_DIR, "db_schema.json");

const NIGHTLY_DIR = path.join(DATA_DIR, "nightly");
const RESULTS_DIR = path.join(NIGHTLY_DIR, "results");
const JOBS_FILE = path.join(NIGHTLY_DIR, "jobs.json");

function ensureDirs() {
  if (!fs.existsSync(NIGHTLY_DIR)) fs.mkdirSync(NIGHTLY_DIR, { recursive: true });
  if (!fs.existsSync(RESULTS_DIR)) fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

function loadJobs() {
  ensureDirs();
  if (!fs.existsSync(JOBS_FILE)) return [];
  try {
    const raw = fs.readFileSync(JOBS_FILE, "utf-8");
    const json = JSON.parse(raw);
    return Array.isArray(json) ? json : [];
  } catch {
    return [];
  }
}

function saveJobs(jobs) {
  ensureDirs();
  fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2), "utf-8");
}

function loadDbSchema() {
  // still used for debugging / future (not required for the fixed SQL builders)
  if (!fs.existsSync(SCHEMA_FILE)) return null;
  try {
    const raw = fs.readFileSync(SCHEMA_FILE, "utf-8");
    const json = JSON.parse(raw);
    return json && Array.isArray(json.models) ? json : null;
  } catch {
    return null;
  }
}

/**
 * POST /api/nightly/jobs  (SAVE)
 */
router.post("/jobs", async (req, res) => {
  try {
    const { jobId, recipeId, options, chartKey, sentence } = req.body || {};
    if (!jobId || !recipeId) {
      return res.status(400).json({ error: "jobId and recipeId are required" });
    }

    const now = new Date().toISOString();
    const jobs = loadJobs();

    const job = {
      jobId,
      recipeId,
      options: options || {},
      chartKey: chartKey || "bar",
      sentence: sentence || "",
      enabled: true,
      updatedAt: now,
      createdAt: now,
    };

    const idx = jobs.findIndex((j) => j.jobId === jobId);
    if (idx >= 0) {
      job.createdAt = jobs[idx].createdAt || now;
      jobs[idx] = { ...jobs[idx], ...job, updatedAt: now };
    } else {
      jobs.push(job);
    }

    saveJobs(jobs);
    return res.json({ ok: true, saved: job });
  } catch (err) {
    console.error("[nightly.routes] POST /jobs error:", err);
    return res.status(500).json({ error: "Failed to save nightly job" });
  }
});

/**
 * POST /api/nightly/jobs/run  (RUN NOW)
 * Body: { jobId, recipeId, querySpec, chartKey, sentence }
 * Writes results JSON to /app/data/nightly/results/<jobId>.json
 */
router.post("/jobs/run", async (req, res) => {
  try {
    ensureDirs();

    const { jobId, recipeId, querySpec, chartKey, sentence } = req.body || {};
    if (!jobId || !recipeId) {
      return res.status(400).json({ error: "jobId and recipeId are required" });
    }

    // Load schema for debugging (not required for fixed SQL)
    const schema = loadDbSchema();

    const sql = buildSql(querySpec);
    const result = await pool.query(sql);

    const now = new Date().toISOString();
    const outFile = path.join(RESULTS_DIR, `${jobId}.json`);

    const payload = {
      ok: true,
      jobId,
      recipeId,
      ranAt: now,
      chartKey: chartKey || querySpec?.chartKey || "bar",
      sentence: sentence || "",
      querySpec,
      sql,
      rows: result.rows || [],
      meta: schema?.meta || null,
    };

    fs.writeFileSync(outFile, JSON.stringify(payload, null, 2), "utf-8");

    return res.json({ ok: true, ranAt: now, rows: payload.rows.length, outFile });
  } catch (err) {
    console.error("[nightly.routes] POST /jobs/run error:", err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
});

/**
 * GET /api/nightly/jobs
 */
router.get("/jobs", (req, res) => {
  try {
    const jobs = loadJobs();
    res.json({ ok: true, jobs });
  } catch (err) {
    res.status(500).json({ error: "Failed to load jobs" });
  }
});

export default router;
