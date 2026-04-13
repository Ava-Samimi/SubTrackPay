import { jest } from "@jest/globals";
import request from "supertest";

const prismaMock = {
  payment: {
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

describe("Payments routes", () => {
  test("GET /api/payments returns payments with include + orderBy", async () => {
    prisma.payment.findMany.mockResolvedValue([{ paymentID: 1 }]);

    const res = await request(app).get("/api/payments");

    expect(res.status).toBe(200);
    expect(prisma.payment.findMany).toHaveBeenCalledWith({
      orderBy: { dueDate: "desc" },
      include: {
        subscription: {
          include: { customer: true, package: true },
        },
      },
    });
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("GET /api/payments/:id returns 400 for invalid id", async () => {
    const res = await request(app).get("/api/payments/abc");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Invalid payment id" });
    expect(prisma.payment.findUnique).not.toHaveBeenCalled();
  });

  test("GET /api/payments/:id returns 404 when not found", async () => {
    prisma.payment.findUnique.mockResolvedValue(null);

    const res = await request(app).get("/api/payments/10");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Payment not found" });
    expect(prisma.payment.findUnique).toHaveBeenCalledWith({
      where: { paymentID: 10 },
      include: {
        subscription: { include: { customer: true, package: true } },
      },
    });
  });

  test("POST /api/payments returns 400 when subscriptionID invalid", async () => {
    const res = await request(app).post("/api/payments").send({
      subscriptionID: "nope",
      dueDate: "2030-01-01",
      status: "DUE",
    });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "subscriptionID is required and must be an integer",
    });
    expect(prisma.payment.create).not.toHaveBeenCalled();
  });

  test("POST /api/payments returns 400 when dueDate invalid", async () => {
    const res = await request(app).post("/api/payments").send({
      subscriptionID: 1,
      dueDate: "not-a-date",
      status: "DUE",
    });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "dueDate is required and must be a valid date",
    });
    expect(prisma.payment.create).not.toHaveBeenCalled();
  });

  test("POST /api/payments returns 400 when status invalid", async () => {
    const res = await request(app).post("/api/payments").send({
      subscriptionID: 1,
      dueDate: "2030-01-01",
      status: "NOPE",
    });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "status is required and must be DUE, PAID, FAILED, or VOID",
    });
    expect(prisma.payment.create).not.toHaveBeenCalled();
  });

  test("POST /api/payments creates payment (paidAt omitted -> null)", async () => {
    prisma.payment.create.mockResolvedValue({ paymentID: 7 });

    const res = await request(app).post("/api/payments").send({
      subscriptionID: "2",
      dueDate: "2030-01-01",
      status: "DUE",
      // paidAt omitted
    });

    expect(res.status).toBe(201);

    const callArg = prisma.payment.create.mock.calls[0][0];
    expect(callArg.data.subscriptionID).toBe(2);
    expect(callArg.data.dueDate).toBeInstanceOf(Date);
    expect(callArg.data.paidAt).toBe(null); // omitted => null in your code
    expect(callArg.data.status).toBe("DUE");
  });

  test("PUT /api/payments/:id returns 400 when dueDate invalid", async () => {
    const res = await request(app)
      .put("/api/payments/1")
      .send({ dueDate: "bad-date" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "dueDate must be a valid date" });
    expect(prisma.payment.update).not.toHaveBeenCalled();
  });

  test("PUT /api/payments/:id returns 404 when payment not found", async () => {
    prisma.payment.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .put("/api/payments/99")
      .send({ status: "PAID" });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Payment not found" });
    expect(prisma.payment.update).not.toHaveBeenCalled();
  });

  test("PUT /api/payments/:id updates payment (paidAt empty string clears to null)", async () => {
    prisma.payment.findUnique.mockResolvedValue({ paymentID: 5 });
    prisma.payment.update.mockResolvedValue({ paymentID: 5, status: "PAID", paidAt: null });

    const res = await request(app)
      .put("/api/payments/5")
      .send({ status: "PAID", paidAt: "" });

    expect(res.status).toBe(200);

    const callArg = prisma.payment.update.mock.calls[0][0];
    expect(callArg.where).toEqual({ paymentID: 5 });
    expect(callArg.data.status).toBe("PAID");
    expect(callArg.data.paidAt).toBe(null); // your code: (paidAt ? pa : null)
  });

  test("DELETE /api/payments/:id returns 204 when deleted", async () => {
    prisma.payment.findUnique.mockResolvedValue({ paymentID: 9 });
    prisma.payment.delete.mockResolvedValue({});

    const res = await request(app).delete("/api/payments/9");

    expect(res.status).toBe(204);
    expect(prisma.payment.delete).toHaveBeenCalledWith({
      where: { paymentID: 9 },
    });
  });
});
