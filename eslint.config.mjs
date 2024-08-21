import globals from "globals";
import eslint from "@eslint/js";
import prettier from "eslint-plugin-prettier/recommended";

export default [
  {
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      camelcase: "error",
    }
  },
  eslint.configs.recommended,
  prettier,
];
