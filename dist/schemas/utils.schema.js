"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.idParamsSchema = void 0;
const zod_1 = require("zod");
exports.idParamsSchema = zod_1.z.object({
    id: zod_1.z.coerce.number().int("L'id doit être un entier").positive("L'id doit être positif"),
});
