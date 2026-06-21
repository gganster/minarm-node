import type { z } from "zod";
import type { Request, Response, NextFunction } from "express";
import { HttpError } from "./error";

// Lit l'id de route validé par `validateParams(idParamsSchema)` (écrit dans
// `safeParams`). Garde runtime : si la route a omis ce middleware, `safeParams`
// est absent -> 400 explicite plutôt qu'un `NaN` silencieux propagé aux requêtes.
export const requireParamId = (req: Request): number => {
  const id = Number(req.safeParams?.id);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, "Paramètre id invalide");
  return id;
};

export const validateBody = <T extends z.ZodTypeAny>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction) => {
    req.body = schema.parse(req.body);
    next();
  };
};

export const validateParams = <T extends z.ZodTypeAny>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction) => {
    req.safeParams = schema.parse(req.params) as typeof req.params;
    next();
  };
};
