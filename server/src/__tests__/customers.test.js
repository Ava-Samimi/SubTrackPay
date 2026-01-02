import request from "supertest";

const { default: app } = await import("../app.js");

describe("GET /api/customers", () => {
  it("returns an array", async () => {
    const res = await request(app).get("/api/customers");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
