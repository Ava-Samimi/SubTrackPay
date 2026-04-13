import { jest } from "@jest/globals";
import request from "supertest";

jest.unstable_mockModule("@prisma/client", () => ({
  PrismaClient: class {
    constructor() { return {}; }
  }
}));

const { default: app } = await import("../app.js");

test("GET /api/health returns ok", async () => {
  const res = await request(app).get("/api/health");
  expect(res.status).toBe(200);
  expect(res.body).toEqual({ ok: true });
});
