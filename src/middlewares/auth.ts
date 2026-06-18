import type { NextFunction, Request, Response } from "express";
import { ForbiddenError } from "./error";
import * as UserService from "../services/user.service";

export function auth(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers.authorization;

  if (!token) throw new ForbiddenError;

  try {
    const payload = UserService.verifyJwt(token);
    req.user = {id: Number(payload.sub)};
    next();
  } catch (e) {throw new ForbiddenError("invalid token")}
}