// server/eslint.config.js
import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,

  // Global ignores (applies to everything)
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "build/**",
      "prisma/migrations/**",

      // Ignore Jest/testing artifacts (not used right now)
      "**/__tests__/**",
      "**/__mocks__/**",
      "**/*.test.*",
      "**/*.spec.*",
      "**/jest.config.*",
    ],
  },

  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "no-console": "off",
    },
  },
];
