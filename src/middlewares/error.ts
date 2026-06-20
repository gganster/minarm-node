import type { ErrorRequestHandler } from "express";
import { Prisma } from "../generated/prisma/client";
import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

export class NotFoundError extends HttpError {
  constructor(message?: string) {
    super(404, message ?? "not found");
  }
}

export class ForbiddenError extends HttpError {
  constructor(message?: string) {
    super(403, message ?? "forbidden");
  }
}

export const errorMiddleware: ErrorRequestHandler = (error, req, res, _next) => {
  console.error(error);
  
  if (error instanceof HttpError) {
    return res.status(error.status).json({
      status: error.status,
      message: error.message
    });
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      status: 400,
      message: "validation failed",
    })
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
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
  })
}