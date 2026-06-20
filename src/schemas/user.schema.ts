import {z} from "zod";

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8)
});
export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  email: z.email(),
  password: z.string().min(8)
});
export type SignupInput = z.infer<typeof signupSchema>;
