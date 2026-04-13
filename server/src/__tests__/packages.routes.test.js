import { jest } from "@jest/globals";
import request from "supertest";

// Shared Prisma mock used by mocked PrismaClient
const prismaMock = {
  package: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

// Mock PrismaClient so `new PrismaClient()` returns prismaMock
jest.unstable_mockModule("@prisma/client", () => ({
  PrismaClient: class {
    constructor() {
      return prismaMock;
    }
  }
}));

// Import app AFTER mock is registered
const { default: app } = await import("../app.js");
const { prisma } = await import("../prisma.js"); // will be prismaMock

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Packages routes", () => {
  test("GET /api/packages returns packages ordered by packageID desc", async () => {
    prisma.package.findMany.mockResolvedValue([
      { packageID: 2, monthlyCost: 20, annualCost: 200 },
      { packageID: 1, monthlyCost: 10, annualCost: 100 },
    ]);

    const res = await request(app).get("/api/packages");

    expect(res.status).toBe(200);
    expect(prisma.package.findMany).toHaveBeenCalledWith({
      orderBy: { packageID: "desc" },
    });
    expect(res.body.length).toBe(2);
  });

  test("GET /api/packages/:id returns 400 for invalid id", async () => {
    const res = await request(app).get("/api/packages/nope");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Invalid package id" });
    expect(prisma.package.findUnique).not.toHaveBeenCalled();
  });

  test("GET /api/packages/:id returns 404 when not found", async () => {
    prisma.package.findUnique.mockResolvedValue(null);

    const res = await request(app).get("/api/packages/123");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Package not found" });
    expect(prisma.package.findUnique).toHaveBeenCalledWith({
      where: { packageID: 123 },
    });
  });

  test("POST /api/packages returns 400 when monthlyCost is invalid", async () => {
    const res = await request(app)
      .post("/api/packages")
      .send({ monthlyCost: -1, annualCost: 100 });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "monthlyCost must be a non-negative integer" });
    expect(prisma.package.create).not.toHaveBeenCalled();
  });

  test("POST /api/packages returns 400 when annualCost is invalid", async () => {
    const res = await request(app)
      .post("/api/packages")
      .send({ monthlyCost: 10, annualCost: "abc" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "annualCost must be a non-negative integer" });
    expect(prisma.package.create).not.toHaveBeenCalled();
  });

  test("POST /api/packages creates package (casts to int)", async () => {
    prisma.package.create.mockResolvedValue({
      packageID: 9,
      monthlyCost: 10,
      annualCost: 100,
    });

    const res = await request(app)
      .post("/api/packages")
      .send({ monthlyCost: "10", annualCost: "100" });

    expect(res.status).toBe(201);
    expect(prisma.package.create).toHaveBeenCalledWith({
      data: { monthlyCost: 10, annualCost: 100 },
    });
    expect(res.body.packageID).toBe(9);
  });

  test("PUT /api/packages/:id returns 404 when package not found", async () => {
    prisma.package.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .put("/api/packages/50")
      .send({ monthlyCost: 99 });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Package not found" });
    expect(prisma.package.update).not.toHaveBeenCalled();
  });

  test("PUT /api/packages/:id updates package", async () => {
    prisma.package.findUnique.mockResolvedValue({ packageID: 1 });
    prisma.package.update.mockResolvedValue({
      packageID: 1,
      monthlyCost: 25,
      annualCost: 250,
    });

    const res = await request(app)
      .put("/api/packages/1")
      .send({ monthlyCost: 25, annualCost: 250 });

    expect(res.status).toBe(200);
    expect(prisma.package.update).toHaveBeenCalledWith({
      where: { packageID: 1 },
      data: { monthlyCost: 25, annualCost: 250 },
    });
    expect(res.body.monthlyCost).toBe(25);
  });

  test("DELETE /api/packages/:id returns 204 when deleted", async () => {
    prisma.package.findUnique.mockResolvedValue({ packageID: 3 });
    prisma.package.delete.mockResolvedValue({});

    const res = await request(app).delete("/api/packages/3");

    expect(res.status).toBe(204);
    expect(prisma.package.delete).toHaveBeenCalledWith({
      where: { packageID: 3 },
    });
  });

  test("DELETE /api/packages/:id returns 400 when delete fails (in use)", async () => {
    prisma.package.findUnique.mockResolvedValue({ packageID: 3 });
    prisma.package.delete.mockRejectedValue(new Error("Restrict"));

    const res = await request(app).delete("/api/packages/3");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "Failed to delete package (it may be in use by subscriptions)",
    });
  });
});
