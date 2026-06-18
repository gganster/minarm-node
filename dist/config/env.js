"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const env_core_1 = require("@t3-oss/env-core");
const zod_1 = require("zod");
dotenv_1.default.config();
exports.env = (0, env_core_1.createEnv)({
    server: {
        DATABASE_URL: zod_1.z.string().min(1).default("file:./dev.db"),
    },
    runtimeEnv: process.env,
    emptyStringAsUndefined: true
});
