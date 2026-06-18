"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dogSchema = void 0;
const zod_1 = require("zod");
exports.dogSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Le nom est requis"),
    active: zod_1.z.boolean().default(false),
});
