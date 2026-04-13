import { jest } from "@jest/globals";
import request from "supertest";

// Shared Prisma mock object used by the mocked PrismaClient
const prismaMock = {
  customer: {
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

// Import app AFTER the mock is registered
const { default: app } = await import("../app.js");
const { prisma } = await import("../prisma.js"); // will be prismaMock

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Customers routes", () => {
  test("GET /api/customers returns customers (ordered by createdAt desc)", async () => {
    prisma.customer.findMany.mockResolvedValue([
      { customerID: 2, firstName: "B", lastName: "B" },
      { customerID: 1, firstName: "A", lastName: "A" },
    ]);

    const res = await request(app).get("/api/customers");

    expect(res.status).toBe(200);
    expect(prisma.customer.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
    });
    expect(res.body.length).toBe(2);
  });

  test("GET /api/customers/:id returns 400 for invalid id", async () => {
    const res = await request(app).get("/api/customers/not-a-number");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Invalid customer id" });
    expect(prisma.customer.findUnique).not.toHaveBeenCalled();
  });

  test("GET /api/customers/:id returns 404 when not found", async () => {
    prisma.customer.findUnique.mockResolvedValue(null);

    const res = await request(app).get("/api/customers/123");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Customer not found" });
    expect(prisma.customer.findUnique).toHaveBeenCalledWith({
      where: { customerID: 123 },
    });
  });

  test("POST /api/customers returns 400 when firstName missing", async () => {
    const res = await request(app)
      .post("/api/customers")
      .send({ lastName: "Smith" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "firstName is required" });
    expect(prisma.customer.create).not.toHaveBeenCalled();
  });

  test("POST /api/customers creates customer (trims strings, ccExpiration valid)", async () => {
    prisma.customer.create.mockResolvedValue({
      customerID: 10,
      firstName: "John",
      lastName: "Smith",
      email: "john@x.com",
      ccExpiration: "2030-01-01T00:00:00.000Z",
    });

    const res = await request(app)
      .post("/api/customers")
      .send({
        firstName: "  John  ",
        lastName: "  Smith ",
        email: "  john@x.com ",
        ccExpiration: "2030-01-01",
      });

    expect(res.status).toBe(201);
    expect(prisma.customer.create).toHaveBeenCalled();

    // Check data trimming + date conversion happened
    const callArg = prisma.customer.create.mock.calls[0][0];
    expect(callArg.data.firstName).toBe("John");
    expect(callArg.data.lastName).toBe("Smith");
    expect(callArg.data.email).toBe("john@x.com");
    expect(callArg.data.ccExpiration).toBeInstanceOf(Date);

    expect(res.body.customerID).toBe(10);
  });


test("PUT /api/customers/:id returns 400 for invalid id", async () => {
  const res = await request(app).put("/api/customers/abc").send({ firstName: "X" });
  expect(res.status).toBe(400);
  expect(res.body).toEqual({ error: "Invalid customer id" });
});

test("PUT /api/customers/:id returns 404 when not found", async () => {
  prisma.customer.findUnique.mockResolvedValue(null);

  const res = await request(app).put("/api/customers/1").send({ firstName: "John" });

  expect(res.status).toBe(404);
  expect(res.body).toEqual({ error: "Customer not found" });
});

test("PUT /api/customers/:id updates customer (trims)", async () => {
  prisma.customer.findUnique.mockResolvedValue({ customerID: 1 });
  prisma.customer.update.mockResolvedValue({ customerID: 1, firstName: "John", lastName: "Smith" });

  const res = await request(app)
    .put("/api/customers/1")
    .send({ firstName: "  John  ", lastName: " Smith " });

  expect(res.status).toBe(200);

  const callArg = prisma.customer.update.mock.calls[0][0];
  expect(callArg.where).toEqual({ customerID: 1 });
  expect(callArg.data.firstName).toBe("John");
  expect(callArg.data.lastName).toBe("Smith");
});

test("DELETE /api/customers/:id returns 404 when not found", async () => {
  prisma.customer.findUnique.mockResolvedValue(null);

  const res = await request(app).delete("/api/customers/9");

  expect(res.status).toBe(404);
  expect(res.body).toEqual({ error: "Customer not found" });
});

test("DELETE /api/customers/:id returns 204 when deleted", async () => {
  prisma.customer.findUnique.mockResolvedValue({ customerID: 9 });
  prisma.customer.delete.mockResolvedValue({});

  const res = await request(app).delete("/api/customers/9");

  expect(res.status).toBe(204);
  expect(prisma.customer.delete).toHaveBeenCalledWith({ where: { customerID: 9 } });
});


});
