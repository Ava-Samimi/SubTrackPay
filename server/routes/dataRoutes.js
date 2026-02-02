import express from "express";
import fs from "fs";
import path from "path";

export function createDataRouter({ dataDir }) {
  const router = express.Router();

  // Resolve absolute folder once
  const BASE = path.resolve(dataDir);

  // Basic guard: folder must exist
  if (!fs.existsSync(BASE)) {
    console.warn(`[dataRoutes] Data directory does not exist: ${BASE}`);
  }

  // 1) List all .json files
  router.get("/", (req, res) => {
    try {
      const files = fs
        .readdirSync(BASE, { withFileTypes: true })
        .filter((d) => d.isFile() && d.name.toLowerCase().endsWith(".json"))
        .map((d) => d.name)
        .sort();

      res.json({ base: BASE, files });
    } catch (err) {
      console.error("[dataRoutes] list error:", err);
      res.status(500).json({ error: "Failed to list data files" });
    }
  });

  // 2) Get one file: /api/data/package_percentages.json
  router.get("/:filename", (req, res) => {
    try {
      const filename = String(req.params.filename || "");

      // Security: only allow .json and forbid slashes/backslashes
      if (!filename.toLowerCase().endsWith(".json")) {
        return res.status(400).json({ error: "Only .json files are allowed" });
      }
      if (filename.includes("/") || filename.includes("\\") || filename.includes("..")) {
        return res.status(400).json({ error: "Invalid filename" });
      }

      const filePath = path.join(BASE, filename);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "File not found" });
      }

      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader("Cache-Control", "no-store");
      res.send(fs.readFileSync(filePath, "utf-8"));
    } catch (err) {
      console.error("[dataRoutes] read error:", err);
      res.status(500).json({ error: "Failed to read data file" });
    }
  });

  return router;
}
