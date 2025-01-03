import eslint from "@eslint/js";
import importPlugin from "eslint-plugin-import";
import jsxA11y from "eslint-plugin-jsx-a11y";
import prettierRecommended from "eslint-plugin-prettier/recommended";
import reactPlugin from "eslint-plugin-react";
import storybook from "eslint-plugin-storybook";
import globals from "globals";
import tseslint from "typescript-eslint";

const config = [
  {
    name: "project:ignore build artifacts",
    ignores: ["build/**/*"],
  },
  {
    name: "project:environment",
    settings: {
      react: {
        version: "detect",
      },
    },
    languageOptions: {
      globals: {
        ...globals.builtin,
        ...globals.browser,
      },
    },
  },
  // Standard JS rules
  eslint.configs.recommended,
  // eslint-disable-next-line import/no-named-as-default-member
  ...tseslint.configs.recommended,
  // Import/export linting
  {
    settings: {
      "import/resolver": {
        node: true,
        typescript: true,
      },
    },
    ...importPlugin.flatConfigs.recommended,
    languageOptions: {
      ...importPlugin.flatConfigs.recommended.languageOptions,
      ecmaVersion: "latest",
    },
    rules: {
      ...importPlugin.flatConfigs.recommended.rules,
      "import/first": "error",
      "import/no-amd": "error",
      "import/no-anonymous-default-export": "warn",
      "import/no-webpack-loader-syntax": "error",
    },
  },
  importPlugin.flatConfigs.typescript,
  // React-specific linting
  jsxA11y.flatConfigs.recommended,
  {
    name: "react/recommended",
    ...reactPlugin.configs.flat.recommended,
  },
  {
    name: "react/jsx-runtime",
    ...reactPlugin.configs.flat["jsx-runtime"],
  },
  {
    name: "prettier/recommended",
    ...prettierRecommended,
  },
  // Storybook stories
  ...storybook.configs["flat/recommended"],
  {
    name: "project:storybook:check-config",
    ignores: ["!.storybook"],
  },
  {
    name: "project:storybook:test-runner",
    files: [".storybook/test-runner-jest.js"],
    languageOptions: {
      globals: globals.commonjs,
    },
  },
  // // Unit tests
  // {
  //   files: ["**/*.spec.{js,jsx}", "src/vitest.setup.mjs"],
  //   languageOptions: {
  //     globals: {
  //       ...globals.browser,
  //       ...globals.vitest,
  //     },
  //   },
  // },
];

export default config;
