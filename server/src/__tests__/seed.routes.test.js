// server/src/__tests__/seed.routes.test.js
import request from "supertest";
import express from "express";
import { EventEmitter } from "node:events";
import { jest, describe, test, expect, beforeEach } from "@jest/globals";

process.env.NODE_ENV = "test";

// --------------------
// Mock child_process.spawn (ESM-safe)
// --------------------
let spawnMock;

jest.unstable_mockModule("node:child_process", () => {
  spawnMock = jest.fn();
  return { spawn: spawnMock };
});

// ✅ Import ONLY the seed router AFTER mocks (do NOT import app.js)
const { default: seedRouter } = await import("../routes/seed.routes.js");

// ✅ Create a minimal express app just for this router (no Prisma)
function makeTestApp() {
  const app = express();
  app.use(express.json());
  app.use("/api", seedRouter); // so /admin/seed becomes /api/admin/seed
  return app;
}

function makeFakeChild({
  exitCode = 0,
  stdoutText = "",
  stderrText = "",
  throwOnSpawn = false,
} = {}) {
  if (throwOnSpawn) throw new Error("spawn crashed");

  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();

  process.nextTick(() => {
    if (stdoutText) child.stdout.emit("data", Buffer.from(stdoutText));
    if (stderrText) child.stderr.emit("data", Buffer.from(stderrText));
    child.emit("close", exitCode);
  });

  return child;
}

describe("Seed routes", () => {
  beforeEach(() => {
    spawnMock.mockReset();
  });

  test("GET /api/admin/seed returns mounted message", async () => {
    const app = makeTestApp();
    const res = await request(app).get("/api/admin/seed");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, msg: "seed route is mounted" });
  });

  test("POST /api/admin/seed returns 500 when import diagnostic fails", async () => {
    const app = makeTestApp();

    // First spawn: diagnostic fails
    spawnMock.mockImplementationOnce(() =>
      makeFakeChild({ exitCode: 1, stderrText: "ImportError: boom" })
    );

    const res = await request(app)
      .post("/api/admin/seed")
      .send({
        seedCustomers: 10,
        seedSubscriptions: 20,
        seedDistribution: "uniform",
        reset: true,
      });

    expect(res.status).toBe(500);
    expect(res.body.ok).toBe(false);
    expect(res.body.err).toContain("Import diagnostic failed");
    expect(spawnMock).toHaveBeenCalledTimes(1);
  });

  test("POST /api/admin/seed returns 500 when seeder run fails", async () => {
    const app = makeTestApp();

    // First spawn: diagnostic ok
    spawnMock.mockImplementationOnce(() =>
      makeFakeChild({ exitCode: 0, stdoutText: "IMPORT_OK\n" })
    );
    // Second spawn: actual seeder fails
    spawnMock.mockImplementationOnce(() =>
      makeFakeChild({ exitCode: 2, stderrText: "Seeder error!" })
    );

    const res = await request(app)
      .post("/api/admin/seed")
      .send({
        seedCustomers: 10,
        seedSubscriptions: 20,
        seedDistribution: "uniform",
      });

    expect(res.status).toBe(500);
    expect(res.body.ok).toBe(false);
    expect(res.body.code).toBe(2);
    expect(res.body.err).toContain("Seeder error!");
    expect(spawnMock).toHaveBeenCalledTimes(2);
  });

  test("POST /api/admin/seed returns 200 when seeding succeeds", async () => {
    const app = makeTestApp();

    // diagnostic ok
    spawnMock.mockImplementationOnce(() =>
      makeFakeChild({ exitCode: 0, stdoutText: "IMPORT_OK\n" })
    );
    // seeder ok
    spawnMock.mockImplementationOnce(() =>
      makeFakeChild({ exitCode: 0, stdoutText: "seeded!\n" })
    );

    const res = await request(app)
      .post("/api/admin/seed")
      .send({
        seedCustomers: 11,
        seedSubscriptions: 22,
        seedRandomSeed: "",
        seedSkipIfExists: true,
        seedDistribution: "uniform",
        reset: false,
      });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.out).toContain("seeded!");
    expect(spawnMock).toHaveBeenCalledTimes(2);
  });

  test("POST /api/admin/seed returns 500 when spawn throws", async () => {
    const app = makeTestApp();

    // spawn throws immediately
    spawnMock.mockImplementationOnce(() =>
      makeFakeChild({ throwOnSpawn: true })
    );

    const res = await request(app).post("/api/admin/seed").send({});

    expect(res.status).toBe(500);
    expect(res.body.ok).toBe(false);
    expect(res.body.err).toContain("spawn crashed");
    expect(spawnMock).toHaveBeenCalledTimes(1);
  });
});
