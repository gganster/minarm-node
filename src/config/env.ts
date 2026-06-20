import dotenv from "dotenv";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

dotenv.config();

export const env = createEnv({
  server: {
    // Sélectionne le moteur de base : sqlite (dev par défaut) ou postgresql (prod).
    // Pilote l'adaptateur Prisma au runtime (src/lib/prisma.ts) ET le provider du
    // schéma au moment du generate/db push (prisma/set-provider.mjs).
    DATABASE_PROVIDER: z.enum(["sqlite", "postgresql"]).default("sqlite"),
    DATABASE_URL: z.string().min(1).default("file:./dev.db"),
    JWT_SECRET: z.string().min(16),

    // Serveur HTTP
    PORT: z.coerce.number().int().positive().default(3000),

    // Auth (les valeurs par défaut correspondent à docker-compose.yml)
    JWT_EXPIRES_IN: z.string().min(1).default("1d"),
    BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(10),

    // Upload (octets) — aligné sous client_max_body_size de nginx
    UPLOAD_MAX_SIZE: z.coerce.number().int().positive().default(5242880),

    // Rate limiting : global + limiteur dédié plus strict sur /auth
    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
    AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10)
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true
})

// Cohérence provider <-> URL : on échoue au démarrage plutôt que de donner une
// URL Postgres à l'adaptateur SQLite (ou l'inverse). On n'affiche jamais l'URL
// (elle contient le mot de passe).
const isPostgresUrl = /^postgres(?:ql)?:\/\//.test(env.DATABASE_URL);
const isSqliteUrl = env.DATABASE_URL.startsWith("file:");

if (env.DATABASE_PROVIDER === "postgresql" && !isPostgresUrl) {
  throw new Error(
    'DATABASE_PROVIDER=postgresql nécessite une DATABASE_URL en "postgres://" (ou "postgresql://").'
  );
}
if (env.DATABASE_PROVIDER === "sqlite" && !isSqliteUrl) {
  throw new Error('DATABASE_PROVIDER=sqlite nécessite une DATABASE_URL en "file:".');
}