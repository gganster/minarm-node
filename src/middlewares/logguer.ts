import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";

export function logguer(req: Request, res: Response, next: NextFunction): void {
  // En test, on ne journalise pas chaque requête (sortie du runner lisible).
  if (env.NODE_ENV === "test") return next();

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
