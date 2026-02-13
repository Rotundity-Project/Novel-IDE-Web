import nextPlugin from "@next/eslint-plugin-next";
import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import globals from "globals";

/** @type {import('eslint').Linter.Config[]} */
export default [
  js.configs.recommended,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "dist/**",
      "build/**",
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "packages/**/dist/**",
      "server/drizzle/**",
      "**/*.mjs",
      "**/*.cjs",
    ],
  },
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      "@next/next": nextPlugin,
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
    },
    rules: {
      // Next.js recommended rules
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,

      // TypeScript rules
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",

      // React rules
      "react/react-in-jsx-scope": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // General rules
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-unused-vars": "off", // Use TypeScript's version instead
      "no-undef": "off", // TypeScript handles this
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
];
