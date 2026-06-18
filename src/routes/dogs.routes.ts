import {Router} from "express";
import * as DogController from "../controllers/dogs.controller"
import {validateBody} from "../middlewares/validate";
import { z } from "zod";

export const dogSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  active: z.boolean().default(false),
});

export type DogInput = z.infer<typeof dogSchema>;

const dogRouter = Router();

dogRouter.get("/", DogController.listDogs);
dogRouter.get("/:id", DogController.getDog);
dogRouter.post("/", validateBody(dogSchema), DogController.createDog);
dogRouter.delete("/:id", DogController.deleteDog);
dogRouter.put("/:id", DogController.updateDog);

export {dogRouter}