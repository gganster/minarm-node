import { prisma } from "../lib/prisma";
import { SignupInput } from "../schemas/users.schema";
import jwt, { type JwtPayload as JoseJwtPayload, type SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

// `sub` suit la norme JWT (RFC 7519) : une chaîne. L'id numérique est
// converti via String(id) à la signature, et Number(payload.sub) à la lecture.
export interface JwtPayload extends JoseJwtPayload {
  sub: string;
}

export const forgeJwt = (id: number) => (
  jwt.sign({sub: String(id)}, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
    algorithm: "HS256"
  })
)

export const verifyJwt = (token: string): JwtPayload => {
  const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] });

  if (typeof payload === "string") throw new Error("invalid token payload");
  return payload as JwtPayload;
}

export const getUserById = async (id: number) => await prisma.user.findUnique({where: {id}});
export const getUserByEmail = async (email: string) => await prisma.user.findUnique({where: {email}});
export const createUser = async (data: SignupInput) => await prisma.user.create({data});