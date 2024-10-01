import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReactConfig from "eslint-plugin-react/configs/recommended.js";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
  {languageOptions: { globals: globals.browser }},
  {languageOptions: { globals: globals.node }},
  pluginJs.configs.recommended,
  tseslint.configs.recommended,
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
        "@typescript-eslint/no-unused-vars": ["warn", { "ignoreRestSiblings": true }]
      }
  },
];
