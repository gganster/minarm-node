"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("../../generated/prisma/client");
const adapter_better_sqlite3_1 = require("@prisma/adapter-better-sqlite3");
const env_1 = require("../config/env");
const adapter = new adapter_better_sqlite3_1.PrismaBetterSqlite3({ url: env_1.env.DATABASE_URL });
exports.prisma = new client_1.PrismaClient({ adapter });
