import {Router} from "express";
import * as DogController from "../controllers/dogs.controller"

const dogRouter = Router();

dogRouter.get("/", DogController.listDogs);
dogRouter.get("/:id", DogController.getDog);
dogRouter.post("/", DogController.createDog);
dogRouter.delete("/:id", DogController.deleteDog);
dogRouter.put("/:id", DogController.updateDog);

export {dogRouter}