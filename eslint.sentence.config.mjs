import obsidianPlugin from "eslint-plugin-obsidianmd";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    ignores: ["src/**/__tests__/**"]
  },
  {
    files: ["src/**/*.ts"],
    plugins: { obsidianmd: obsidianPlugin },
    languageOptions: {
      parser: tsParser,
      parserOptions: { project: "./tsconfig.json" }
    },
    rules: {
      "obsidianmd/ui/sentence-case": ["warn", { "allowAutoFix": true }]
    }
  }
];
