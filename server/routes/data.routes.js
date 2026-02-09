import express from "express";
import fs from "fs";
import path from "path";

const router = express.Router();

const DATA_DIR = path.resolve(process.env.DATA_DIR || "/app/data");

// Ensure folder exists (safe in Docker + local)
try {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
} catch (err) {
  console.warn("[data.routes] Could not ensure DATA_DIR exists:", DATA_DIR, err);
}

/**
 * GET /api/data
 * Lists all .json files in DATA_DIR
 */
router.get("/", (req, res) => {
  try {
    const files = fs
      .readdirSync(DATA_DIR, { withFileTypes: true })
      .filter((d) => d.isFile() && d.name.toLowerCase().endsWith(".json"))
      .map((d) => d.name)
      .sort();

    res.json({ files });
  } catch (err) {
    console.error("[data.routes] list error:", err);
    res.status(500).json({ error: "Failed to list data files" });
  }
});

/**
 * GET /api/data/:filename
 * Serves one JSON file (must end with .json)
 * Example: /api/data/package_percentages.json
 */
router.get("/:filename", (req, res) => {
  try {
    const filename = String(req.params.filename || "");

    // Security: only allow plain filenames ending in .json
    if (!filename.toLowerCase().endsWith(".json")) {
      return res.status(400).json({ error: "Only .json files are allowed" });
    }
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return res.status(400).json({ error: "Invalid filename" });
    }

    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.send(fs.readFileSync(filePath, "utf-8"));
  } catch (err) {
    console.error("[data.routes] read error:", err);
    res.status(500).json({ error: "Failed to read data file" });
  }
});

export default router;
