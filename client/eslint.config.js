// client/eslint.config.js
import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
  js.configs.recommended,

  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,

      // Vite/React 17+ JSX transform: React import not required
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",

      // Most modern projects don't use PropTypes (especially if you plan TS later)
      "react/prop-types": "off",

      // Vite Fast Refresh safety
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],

      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },

  {
    ignores: ["node_modules/**", "dist/**", "build/**"],
  },
];
