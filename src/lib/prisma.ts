import { PrismaClient } from "../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "../config/env";

// L'adaptateur est choisi selon DATABASE_PROVIDER : Postgres en prod, SQLite en dev.
const adapter =
  env.DATABASE_PROVIDER === "postgresql"
    ? new PrismaPg({ connectionString: env.DATABASE_URL })
    : new PrismaBetterSqlite3({ url: env.DATABASE_URL });

export const prisma = new PrismaClient({ adapter });
