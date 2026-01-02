import request from "supertest";

const { default: app } = await import("../app.js");

describe("GET /api/health", () => {
  it("returns ok:true", async () => {
    const res = await request(app).get("/api/health");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});
