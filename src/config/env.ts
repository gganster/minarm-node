import dotenv from "dotenv";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

dotenv.config();

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1).default("file:./dev.db"),
    JWT_SECRET: z.string().min(16)
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true
})