import { jest } from "@jest/globals";

jest.unstable_mockModule("@prisma/client", () => {
  const makeModel = () =>
    new Proxy(
      {},
      {
        get: () => jest.fn(async () => []),
      }
    );

  class PrismaClient {
    constructor() {
      return new Proxy(
        {},
        {
          get: (target, prop) => {
            if (prop in target) return target[prop];
            target[prop] = makeModel();
            return target[prop];
          },
        }
      );
    }
    async $connect() {}
    async $disconnect() {}
  }

  return { PrismaClient };
});
