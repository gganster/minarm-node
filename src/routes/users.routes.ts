import {Router} from "express";
import {validateBody} from "@/middlewares/validate";
import * as UserController from "@/controllers/users.controller";
import { loginSchema, signupSchema } from "@/schemas/users.schema";

const userRouter = Router();

userRouter.post(
  "/signup",
  validateBody(signupSchema), 
  UserController.signup
);

userRouter.post(
  "/login", 
  validateBody(loginSchema), 
  UserController.login
);

userRouter.get(
  "/verify",
  UserController.verify
)

export {userRouter};