import type { NextFunction, Request, Response } from "express";
import { ForbiddenError } from "./error";
import * as UserService from "@/services/users.service";

// Récupère l'id de l'utilisateur authentifié (posé par `auth` sur les routes
// protégées). Garde-fou runtime : si `req.user` est absent (route montée sans
// `auth`), on renvoie 403 au lieu de déréférencer `undefined`. Évite les
// `req.user!` épars dans les controllers tout en typant l'invariant en un point.
export const requireUserId = (req: Request): number => {
  if (!req.user) throw new ForbiddenError;
  return req.user.id;
};

export function auth(req: Request, _res: Response, next: NextFunction): void {
  const token = req.headers.authorization;

  if (!token) throw new ForbiddenError;

  try {
    const payload = UserService.verifyJwt(token);
    req.user = {id: Number(payload.sub)};
    next();
  } catch {throw new ForbiddenError("invalid token")}
}