// server/src/routes/seed.routes.js
import express from "express";
import { createLogger } from "../logger.js";

const log = createLogger("seed.routes");
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
  log.info("✅ /api/admin/seed POST hit", req.body);

  const {
    seedCustomers,
    seedSubscriptions,
    seedRandomSeed,
    seedSkipIfExists,
    seedDistribution,
    seedPostalDistribution,
    reset,
  } = req.body || {};

  const env = {
    ...process.env,
    SEED_CUSTOMERS: String(seedCustomers ?? 500),
    SEED_SUBSCRIPTIONS: String(seedSubscriptions ?? 500),
    SEED_RANDOM_SEED:
      seedRandomSeed === "" || seedRandomSeed == null ? "0" : String(seedRandomSeed),
    SEED_SKIP_IF_EXISTS: seedSkipIfExists ? "1" : "0",
    SEED_DISTRIBUTION: seedDistribution ?? "uniform",
    SEED_POSTAL_DISTRIBUTION: seedPostalDistribution ?? "mixed_realistic",
    SEED_RESET: reset ? "1" : "0",
    PYTHONPATH: "/app/seeder",
  };

  log.info("✅ Seeder env preview", {
    SEED_CUSTOMERS: env.SEED_CUSTOMERS,
    SEED_SUBSCRIPTIONS: env.SEED_SUBSCRIPTIONS,
    SEED_RANDOM_SEED: env.SEED_RANDOM_SEED,
    SEED_SKIP_IF_EXISTS: env.SEED_SKIP_IF_EXISTS,
    SEED_DISTRIBUTION: env.SEED_DISTRIBUTION,
    SEED_POSTAL_DISTRIBUTION: env.SEED_POSTAL_DISTRIBUTION,
    SEED_RESET: env.SEED_RESET,
    PYTHONPATH: env.PYTHONPATH,
  });

  try {
    // Optional diagnostic while developing
    const diag = await runChild(
      "python3",
      [
        "-c",
        [
          "import sys, os;",
          "print('CWD=', os.getcwd());",
          "print('PYTHONPATH=', os.environ.get('PYTHONPATH'));",
          "print('SEED_DISTRIBUTION=', os.environ.get('SEED_DISTRIBUTION'));",
          "print('SEED_POSTAL_DISTRIBUTION=', os.environ.get('SEED_POSTAL_DISTRIBUTION'));",
          "print('SEED_RESET=', os.environ.get('SEED_RESET'));",
          "import seeder.seeders as s;",
          "print('IMPORT_OK');",
        ].join(" "),
      ],
      { env, cwd: "/app/seeder" }
    );

    if (diag.code !== 0) {
      log.error("❌ Seeder import diagnostic failed:", diag.err || diag.out);
      return res.status(500).json({
        ok: false,
        code: diag.code,
        err: "Import diagnostic failed:\n" + (diag.err || diag.out),
      });
    }

    // Run actual seeder
    const run = await runChild("python3", ["-u", "/app/seed_db.py"], {
      env,
      cwd: "/app/seeder",
    });

    if (run.code !== 0) {
      log.error("❌ Seeder failed:", run.err || run.out);
      return res.status(500).json({
        ok: false,
        code: run.code,
        err: run.err || run.out,
      });
    }

    return res.json({ ok: true, out: run.out });
  } catch (e) {
    log.error("❌ /api/admin/seed crashed:", e);
    return res.status(500).json({ ok: false, err: String(e) });
  }
});

export default router;