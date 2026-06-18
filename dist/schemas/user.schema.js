"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signupSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.email(),
    password: zod_1.z.string().min(8)
});
exports.signupSchema = zod_1.z.object({
    email: zod_1.z.email(),
    password: zod_1.z.string().min(8)
});
