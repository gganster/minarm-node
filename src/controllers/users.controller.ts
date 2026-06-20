import type { Request, Response } from "express";
import type { RequestWithBody } from "../types/http";
import type { LoginInput, SignupInput } from "../schemas/user.schema";
import * as UserService from "../services/user.service";
import bcrypt from "bcrypt";
import { ForbiddenError, HttpError } from "../middlewares/error";
import { env } from "../config/env";

export const signup = async (req: RequestWithBody<SignupInput>, res: Response) => {
  //check if email exists
  const user = await UserService.getUserByEmail(req.body.email);

  if (user) throw new HttpError(409, "User already exists");

  const {password, ...newUser} = await UserService.createUser({
    ...req.body,
    password: await bcrypt.hash(req.body.password, env.BCRYPT_ROUNDS)
  });

  return res.status(201).json({
    user: newUser,
    jwt: UserService.forgeJwt(newUser.id)
  });
}

export const login = async (req: RequestWithBody<LoginInput>, res: Response) => {
  const user = await UserService.getUserByEmail(req.body.email);

  if (!user) {
    await bcrypt.compare("req.body.password", "user.password");
    throw new HttpError(401, "Invalid password")
  };
  if (!(await bcrypt.compare(req.body.password, user.password))) throw new HttpError(401, "Invalid password");

  return res.status(200).json({jwt: UserService.forgeJwt(user.id)})
}

export const verify = (req: Request, res: Response) => {
  const jwt = req.headers.authorization;

  if (!jwt) throw new ForbiddenError;

  try {
    UserService.verifyJwt(jwt);
    return res.status(200).json({message: "ok"})
  } catch {
    throw new ForbiddenError;
  }
}
