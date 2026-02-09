import { jest } from "@jest/globals";
import request from "supertest";

const prismaMock = {
  subscription: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

jest.unstable_mockModule("@prisma/client", () => ({
  PrismaClient: class {
    constructor() {
      return prismaMock;
    }
  }
}));

const { default: app } = await import("../app.js");
const { prisma } = await import("../prisma.js"); // mocked

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Subscriptions routes", () => {
  test("GET /api/subscriptions returns subscriptions with include + orderBy", async () => {
    prisma.subscription.findMany.mockResolvedValue([{ subscriptionID: 1 }]);

    const res = await request(app).get("/api/subscriptions");

    expect(res.status).toBe(200);
    expect(prisma.subscription.findMany).toHaveBeenCalledWith({
      orderBy: { startDate: "desc" },
      include: { customer: true, package: true },
    });
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("GET /api/subscriptions/:id returns 400 for invalid id", async () => {
    const res = await request(app).get("/api/subscriptions/abc");
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Invalid subscription id" });
    expect(prisma.subscription.findUnique).not.toHaveBeenCalled();
  });

  test("GET /api/subscriptions/:id returns 404 when not found", async () => {
    prisma.subscription.findUnique.mockResolvedValue(null);

    const res = await request(app).get("/api/subscriptions/10");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Subscription not found" });
    expect(prisma.subscription.findUnique).toHaveBeenCalledWith({
      where: { subscriptionID: 10 },
      include: { customer: true, package: true, payments: true },
    });
  });

  test("POST /api/subscriptions returns 400 when customerID invalid", async () => {
    const res = await request(app).post("/api/subscriptions").send({
      customerID: "nope",
      packageID: 1,
      billingCycle: "MONTHLY",
      status: "ACTIVE",
      price: 10,
    });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "customerID is required and must be an integer" });
    expect(prisma.subscription.create).not.toHaveBeenCalled();
  });

  test("POST /api/subscriptions returns 400 when billingCycle invalid", async () => {
    const res = await request(app).post("/api/subscriptions").send({
      customerID: 1,
      packageID: 1,
      billingCycle: "WEEKLY",
      status: "ACTIVE",
      price: 10,
    });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "billingCycle must be MONTHLY or ANNUAL" });
    expect(prisma.subscription.create).not.toHaveBeenCalled();
  });

  test("POST /api/subscriptions returns 400 when status invalid", async () => {
    const res = await request(app).post("/api/subscriptions").send({
      customerID: 1,
      packageID: 1,
      billingCycle: "MONTHLY",
      status: "INVALID",
      price: 10,
    });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "status is required and must be ACTIVE, PAUSED, or CANCELED",
    });
    expect(prisma.subscription.create).not.toHaveBeenCalled();
  });

  test("POST /api/subscriptions returns 400 when startDate is invalid", async () => {
    const res = await request(app).post("/api/subscriptions").send({
      customerID: 1,
      packageID: 1,
      billingCycle: "MONTHLY",
      status: "ACTIVE",
      price: 10,
      startDate: "not-a-date",
    });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "startDate must be a valid date (or omit it)" });
    expect(prisma.subscription.create).not.toHaveBeenCalled();
  });

  test("POST /api/subscriptions creates subscription (dates converted)", async () => {
    prisma.subscription.create.mockResolvedValue({
      subscriptionID: 7,
      customer: { customerID: 1 },
      package: { packageID: 2 },
    });

    const res = await request(app).post("/api/subscriptions").send({
      customerID: "1",
      packageID: "2",
      billingCycle: "ANNUAL",
      status: "ACTIVE",
      price: "120",
      startDate: "2030-01-01",
      endDate: null,
    });

    expect(res.status).toBe(201);

    const callArg = prisma.subscription.create.mock.calls[0][0];
    expect(callArg.data.customerID).toBe(1);
    expect(callArg.data.packageID).toBe(2);
    expect(callArg.data.price).toBe(120);
    expect(callArg.data.startDate).toBeInstanceOf(Date);
    expect(callArg.data.endDate).toBe(null);
    expect(callArg.include).toEqual({ customer: true, package: true });
  });

  test("PUT /api/subscriptions/:id returns 404 when not found", async () => {
    prisma.subscription.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .put("/api/subscriptions/5")
      .send({ status: "PAUSED" });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Subscription not found" });
    expect(prisma.subscription.update).not.toHaveBeenCalled();
  });

  test("PUT /api/subscriptions/:id updates subscription", async () => {
    prisma.subscription.findUnique.mockResolvedValue({ subscriptionID: 5 });
    prisma.subscription.update.mockResolvedValue({
      subscriptionID: 5,
      status: "PAUSED",
    });

    const res = await request(app)
      .put("/api/subscriptions/5")
      .send({ status: "PAUSED", price: 50, endDate: "2031-01-01" });

    expect(res.status).toBe(200);

    const callArg = prisma.subscription.update.mock.calls[0][0];
    expect(callArg.where).toEqual({ subscriptionID: 5 });
    expect(callArg.data.status).toBe("PAUSED");
    expect(callArg.data.price).toBe(50);
    expect(callArg.data.endDate).toBeInstanceOf(Date);
    expect(callArg.include).toEqual({ customer: true, package: true });
  });

  test("DELETE /api/subscriptions/:id returns 204 when deleted", async () => {
    prisma.subscription.findUnique.mockResolvedValue({ subscriptionID: 9 });
    prisma.subscription.delete.mockResolvedValue({});

    const res = await request(app).delete("/api/subscriptions/9");

    expect(res.status).toBe(204);
    expect(prisma.subscription.delete).toHaveBeenCalledWith({
      where: { subscriptionID: 9 },
    });
  });
});
