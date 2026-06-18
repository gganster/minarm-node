import {Router} from "express";
import * as DogController from "../controllers/dogs.controller"
import {validateBody, validateParams} from "../middlewares/validate";
import { z } from "zod";

import { dogSchema, type DogInput } from "../schemas/dogs.schema";
import { idParamsSchema } from "../schemas/utils.schema";

const dogRouter = Router();

dogRouter.get(
  "/", 
  DogController.listDogs
);

dogRouter.get(
  "/:id", 
  validateParams(idParamsSchema), 
  DogController.getDog
);

dogRouter.post(
  "/", 
  validateBody(dogSchema), 
  DogController.createDog
);

dogRouter.delete(
  "/:id", 
  validateParams(idParamsSchema), 
  DogController.deleteDog
);

dogRouter.put(
  "/:id", 
  validateParams(idParamsSchema), 
  validateBody(dogSchema), 
  DogController.updateDog
);

export {dogRouter}