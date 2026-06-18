import type { z } from "zod";
import type { Request, Response, NextFunction } from "express";

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
