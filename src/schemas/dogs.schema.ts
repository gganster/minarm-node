import {z} from "zod";

export const dogSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  active: z.boolean().default(false),
});

export type DogInput = z.infer<typeof dogSchema>;