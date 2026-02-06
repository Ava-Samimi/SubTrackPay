// server/src/routes/seed.routes.js
import express from "express";
import { spawn } from "child_process";

const router = express.Router();

router.get("/admin/seed", (req, res) => {
  res.json({ ok: true, msg: "seed route is mounted" });
});

// helper: run a command and capture stdout/stderr
function runChild(command, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, options);

    let out = "";
    let err = "";

    child.stdout.on("data", (d) => (out += d.toString()));
    child.stderr.on("data", (d) => (err += d.toString()));

    child.on("close", (code) => resolve({ code, out, err }));
  });
}

// POST /api/admin/seed
router.post("/admin/seed", async (req, res) => {
  console.log("✅ /api/admin/seed POST hit", req.body);

  const {
    seedCustomers,
    seedSubscriptions,
    seedRandomSeed,
    seedSkipIfExists,
    seedDistribution,
    reset, // ✅ NEW: wipe tables before reseeding
  } = req.body || {};

  // ✅ IMPORTANT:
  // Your code lives at /app/seeder/seeder/seeders.py
  // To import "seeder.seeders", Python must have /app/seeder on sys.path.
  const env = {
    ...process.env,
    SEED_CUSTOMERS: String(seedCustomers ?? 500),
    SEED_SUBSCRIPTIONS: String(seedSubscriptions ?? 500),
    SEED_RANDOM_SEED:
      seedRandomSeed === "" || seedRandomSeed == null ? "0" : String(seedRandomSeed),
    SEED_SKIP_IF_EXISTS: seedSkipIfExists ? "1" : "0",
    SEED_DISTRIBUTION: seedDistribution ?? "uniform",

    // ✅ NEW: instruct python seeder to truncate/reset first
    SEED_RESET: reset ? "1" : "0",

    // ✅ make "/app/seeder" importable
    PYTHONPATH: "/app/seeder",
  };

  try {
    // (Optional) quick import diagnostic (keep it while developing)
    const diag = await runChild(
      "python3",
      [
        "-c",
        [
          "import sys, os;",
          "print('CWD=', os.getcwd());",
          "print('PYTHONPATH=', os.environ.get('PYTHONPATH'));",
          "import seeder.seeders as s;",
          "print('IMPORT_OK');",
        ].join(" "),
      ],
      { env, cwd: "/app/seeder" }
    );

    if (diag.code !== 0) {
      console.error("❌ Seeder import diagnostic failed:", diag.err || diag.out);
      return res.status(500).json({
        ok: false,
        code: diag.code,
        err: "Import diagnostic failed:\n" + (diag.err || diag.out),
      });
    }

    // 2) run the actual seeder
    const run = await runChild("python3", ["-u", "/app/seed_db.py"], {
      env,
      cwd: "/app/seeder",
    });

    if (run.code !== 0) {
      console.error("❌ Seeder failed:", run.err || run.out);
      return res.status(500).json({ ok: false, code: run.code, err: run.err || run.out });
    }

    return res.json({ ok: true, out: run.out });
  } catch (e) {
    console.error("❌ /api/admin/seed crashed:", e);
    return res.status(500).json({ ok: false, err: String(e) });
  }
});

export default router;
