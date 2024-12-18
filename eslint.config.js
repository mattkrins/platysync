import globals from "globals";
import js from "@eslint/js";
import ts from "typescript-eslint";
import pluginReactConfig from "eslint-plugin-react/configs/recommended.js";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      }
    }
  },
  pluginReactConfig,
  {
    name: "reactRefresh",
    plugins: {
      "react-refresh": reactRefresh,
    },
    rules: {
      "react-refresh/only-export-components": "warn",
    },
  },
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    ignores: ["*.js", "*.cjs", "*.mjs"],
    rules: {
        "no-unused-vars": "off",
        "@typescript-eslint/no-unused-vars": ["warn", {
          "ignoreRestSiblings": true,
          "argsIgnorePattern": "^_",
          "caughtErrorsIgnorePattern": "^_",
          "destructuredArrayIgnorePattern": "^_",
          "varsIgnorePattern": "^_",
        }],
        "react/jsx-uses-react": "off",
        "react/react-in-jsx-scope": "off",
        "prefer-const": ["error", {
          "destructuring": "all",
          "ignoreReadBeforeAssign": false
        }],
      }
  },
];
