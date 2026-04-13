export default {
  testEnvironment: "node",

  // Run only the route-level integration tests
  testMatch: [
    "<rootDir>/src/__tests__/customers.routes.test.js",
    "<rootDir>/src/__tests__/packages.routes.test.js",
    "<rootDir>/src/__tests__/subscriptions.routes.test.js",
    "<rootDir>/src/__tests__/payments.routes.test.js",
    "<rootDir>/src/__tests__/seed.routes.test.js",
    "<rootDir>/src/__tests__/health.test.js",
  ],

  // Sets up the Prisma mock and NODE_ENV before each test file
  setupFiles: ["<rootDir>/src/__tests__/setupTests.js"],

  // Coverage — focused on the routes under test
  collectCoverage: true,
  collectCoverageFrom: [
    "src/routes/customers.routes.js",
    "src/routes/packages.routes.js",
    "src/routes/subscriptions.routes.js",
    "src/routes/payments.routes.js",
    "src/routes/seed.routes.js",
    "src/app.js",
    "src/prisma.js",
    "!src/**/__tests__/**",
    "!src/index.js",
  ],
  coverageReporters: ["text", "lcov"],

  verbose: true,
  testPathIgnorePatterns: ["/node_modules/"],
};

