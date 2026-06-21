import type { ErrorRequestHandler, Response } from "express";
import { MulterError } from "multer";
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

// On ne logge en `error` que les 5xx (vrais incidents serveur). Les 4xx sont des
// erreurs client attendues (mauvais login, 404, validation) : les passer en
// `error` noierait les vrais incidents et amplifierait le bruit sous brute-force.
const logError = (error: unknown, status: number): void => {
  if (status >= 500) {
    console.error(error);
  } else {
    console.info(`${status} ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Toutes les réponses d'erreur partagent la forme `{ status, message }`.
const fail = (res: Response, status: number, message: string) =>
  res.status(status).json({ status, message });

export const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof HttpError) {
    logError(error, error.status);
    return fail(res, error.status, error.message);
  }

  if (error instanceof ZodError) {
    logError(error, 400);
    return fail(res, 400, "validation failed");
  }

  if (error instanceof MulterError) {
    // Dépassement de taille -> 413 ; tout autre rejet multer (champ inattendu,
    // trop de fichiers…) -> 400. Sans ça, ces erreurs tombaient dans le 500.
    const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    logError(error, status);
    return fail(
      res,
      status,
      error.code === "LIMIT_FILE_SIZE" ? "Fichier trop volumineux" : "Upload invalide"
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      logError(error, 409);
      return fail(res, 409, "Unique constraint violation");
    }

    if (error.code === "P2025") {
      logError(error, 404);
      return fail(res, 404, "Resource not found");
    }
  }

  logError(error, 500);
  return fail(res, 500, "Internal server error");
};
