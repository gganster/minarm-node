import {Router} from "express";
import * as DogController from "@/controllers/dogs.controller"
import {validateBody, validateParams} from "@/middlewares/validate";

import { dogSchema } from "@/schemas/dogs.schema";
import { idParamsSchema } from "@/schemas/utils.schema";
import { upload } from "@/middlewares/upload";

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

dogRouter.post(
  "/:id/upload",
  validateParams(idParamsSchema),
  upload.single("attachment"),
  DogController.upload
);

// Sert une pièce jointe, scoppé au propriétaire (l'autorisation est faite dans
// le controller). `auth` est déjà appliqué au montage du router (/dogs).
// `/upload/:filename` (2 segments) ne peut pas entrer en conflit avec `/:id`.
dogRouter.get(
  "/upload/:filename",
  DogController.serveAttachment
);

export {dogRouter}