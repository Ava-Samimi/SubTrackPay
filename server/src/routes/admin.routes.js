// src/routes/admin.routes.js
import express from "express";
import { execFile } from "node:child_process";
import path from "node:path";

const router = express.Router();

function getPythonCommand() {
  // Windows often uses the Python launcher: "py"
  if (process.platform === "win32") return "py";
  // mac/linux usually have "python3"
  return "python3";
}

function runResetAndSeed() {
  return new Promise((resolve, reject) => {
    const script = path.resolve("server/seeder/reset_and_seed.py");
    const pyCmd = getPythonCommand();

    // For Windows "py", we must pass "-3" to force Python 3 (recommended)
    const args =
      pyCmd === "py" ? ["-3", script] : [script];

    execFile(pyCmd, args, { env: process.env }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.message));
      resolve((stdout || "") + (stderr || ""));
    });
  });
}

router.post("/repopulate", async (req, res) => {
  try {
    const log = await runResetAndSeed();
    return res.json({ ok: true, message: "Database repopulated.", log });
  } catch (e) {
    console.error("Repopulate failed:", e);
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

export default router;
