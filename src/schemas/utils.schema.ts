import {z} from "zod";

export const idParamsSchema = z.object({
  id: z.coerce.number().int("L'id doit être un entier").positive("L'id doit être positif"),
});

export type IdParams = z.infer<typeof idParamsSchema>;
