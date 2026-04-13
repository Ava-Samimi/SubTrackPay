// server/jest.config.cjs
module.exports = {
  testEnvironment: "node",

  // ✅ Only run CRUD + seed route tests
  testMatch: [
    "<rootDir>/src/__tests__/customers.routes.test.js",
    "<rootDir>/src/__tests__/packages.routes.test.js",
    "<rootDir>/src/__tests__/subscriptions.routes.test.js",
    "<rootDir>/src/__tests__/payments.routes.test.js",
    "<rootDir>/src/__tests__/seed.routes.test.js"
  ],

  // Run before each test file (we use this to set NODE_ENV=test)
  setupFiles: ["<rootDir>/jest.setup.js"],

  // Coverage
  collectCoverage: true,
  collectCoverageFrom: [
    // ✅ focus coverage on what you're testing
    "src/routes/customers.routes.js",
    "src/routes/packages.routes.js",
    "src/routes/subscriptions.routes.js",
    "src/routes/payments.routes.js",
    "src/routes/seed.routes.js",

    // (optional but useful)
    "src/app.js",
    "src/prisma.js",

    // ❌ exclude tests + boot file
    "!src/**/__tests__/**",
    "!src/index.js"
  ],

  verbose: true,
  testPathIgnorePatterns: ["/node_modules/"]
};
