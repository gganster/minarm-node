// @ts-check

import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    // Remplace .eslintignore : code généré, build et artefacts runtime exclus.
    ignores: [
      "dist/**",
      "src/generated/**",
      "uploads/**",
      "coverage/**",
      "**/*.tsbuildinfo",
    ],
  },
  {
    // Règles de base JS pour tous les fichiers (TS + scripts/config .mjs/.cjs).
    files: ["**/*.{ts,mts,cts,js,mjs,cjs}"],
    extends: [js.configs.recommended],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  {
    // Règles TypeScript (sans info de type) sur toutes les sources TS :
    // configure le parser et couvre les fichiers TS hors du projet tsconfig
    // (ex. scratch à la racine).
    files: ["**/*.{ts,mts,cts}"],
    extends: [tseslint.configs.recommended],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  {
    // Linting "type-aware" sur le code applicatif (couvert par tsconfig.json).
    // Active les règles qui attrapent les vrais bugs async/typage :
    // no-floating-promises, no-misused-promises, await-thenable, etc.
    files: ["src/**/*.ts"],
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      // Dette technique connue : req.body est `any` tant qu'il n'est pas typé
      // après la validation Zod. On signale (warn) sans bloquer le lint.
      "@typescript-eslint/no-unsafe-argument": "warn",
      "@typescript-eslint/no-unsafe-member-access": "warn",
      "@typescript-eslint/no-unsafe-assignment": "warn",
      "@typescript-eslint/no-unsafe-call": "warn",
      "@typescript-eslint/no-unsafe-return": "warn",
      "@typescript-eslint/require-await": "warn",
    },
  },
);
