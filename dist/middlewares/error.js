"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = exports.ForbiddenError = exports.NotFoundError = exports.HttpError = void 0;
const client_1 = require("../../generated/prisma/client");
const zod_1 = require("zod");
class HttpError extends Error {
    status;
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}
exports.HttpError = HttpError;
class NotFoundError extends HttpError {
    constructor(message) {
        super(404, message ?? "not found");
    }
}
exports.NotFoundError = NotFoundError;
class ForbiddenError extends HttpError {
    constructor(message) {
        super(403, message ?? "forbidden");
    }
}
exports.ForbiddenError = ForbiddenError;
const errorMiddleware = (error, req, res, next) => {
    console.error(error);
    if (error instanceof HttpError) {
        return res.status(error.status).json({
            status: error.status,
            message: error.message
        });
    }
    if (error instanceof zod_1.ZodError) {
        return res.status(400).json({
            status: 400,
            message: "validation failed",
        });
    }
    if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
            res.status(409).json({ message: "Unique constraint violation" });
            return;
        }
        if (error.code === "P2025") {
            res.status(404).json({ message: "Resource not found" });
            return;
        }
    }
    res.status(500).json({
        status: 500,
        message: "Internal server error"
    });
};
exports.errorMiddleware = errorMiddleware;
