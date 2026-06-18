"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logguer = logguer;
function logguer(req, res, next) {
    const startedAt = process.hrtime.bigint();
    res.on("finish", () => {
        const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
        const method = req.method;
        const url = req.originalUrl;
        const statusCode = res.statusCode;
        const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
        console.info(`${method} ${url} ${statusCode} ${durationMs.toFixed(1)}ms ${ip}`);
    });
    next();
}
