// Synchronise le `provider` de la datasource Prisma avec DATABASE_PROVIDER.
//
// Prisma n'accepte pas `provider = env(...)` dans le schéma : la valeur doit être
// un littéral et le client généré est spécifique au dialecte (SQLite vs Postgres).
// Ce script aligne donc schema.prisma sur DATABASE_PROVIDER AVANT tout
// `prisma generate` / `db push` / `migrate`, pour faire de DATABASE_PROVIDER la
// seule source de vérité (dev = sqlite, prod = postgresql).
import "dotenv/config";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const provider = process.env.DATABASE_PROVIDER ?? "sqlite";

if (provider !== "sqlite" && provider !== "postgresql") {
  console.error(
    `DATABASE_PROVIDER invalide : "${provider}" (attendu : "sqlite" ou "postgresql")`
  );
  process.exit(1);
}

const schemaPath = join(dirname(fileURLToPath(import.meta.url)), "schema.prisma");
const original = readFileSync(schemaPath, "utf8");

// Ne cible que le provider DANS le bloc `datasource { ... }` (ancrage via
// [^}]*? qui interdit de franchir le `}`), jamais celui du generator.
const updated = original.replace(
  /(datasource\s+\w+\s*\{[^}]*?provider\s*=\s*")(?:sqlite|postgresql)(")/,
  `$1${provider}$2`
);

if (updated === original) {
  console.log(`schema.prisma : datasource provider déjà sur "${provider}".`);
} else {
  writeFileSync(schemaPath, updated);
  console.log(`schema.prisma : datasource provider -> "${provider}".`);
}
