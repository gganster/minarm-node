import dotenv from "dotenv";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

dotenv.config();

export const env = createEnv({
  server: {
    // URL de connexion PostgreSQL (postgres:// ou postgresql://). Pas de défaut :
    // la config est explicite (.env en dev, docker-compose en prod).
    DATABASE_URL: z
      .string()
      .regex(
        /^postgres(?:ql)?:\/\//,
        'DATABASE_URL doit être une URL PostgreSQL ("postgres://" ou "postgresql://").'
      ),
    JWT_SECRET: z.string().min(16),

    // Serveur HTTP
    PORT: z.coerce.number().int().positive().default(3000),

    // Auth (les valeurs par défaut correspondent à docker-compose.yml)
    JWT_EXPIRES_IN: z.string().min(1).default("1d"),
    BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(10),

    // CORS : origine(s) autorisée(s), séparées par des virgules.
    // En prod, régler sur l'URL publique du frontend (ex. https://app.exemple.com).
    CORS_ORIGIN: z.string().min(1).default("http://localhost"),

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