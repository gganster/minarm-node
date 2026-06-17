import {Router} from "express";
import * as DogsController from "../controllers/dogs.controller";
import { dogValidator } from "../types/dogs";

const dogRouter = Router();

dogRouter.get("/", async (req, res) => {
  const dogs = await DogsController.getDogs();
  return res.status(200).json(dogs);
});

dogRouter.get("/:id", async (req, res) => {
  const dog = await DogsController.getDogById(req.params.id);

  if (!dog) return res.status(404).json({ status: 404, message: "Dog not found" });
  return res.status(200).json(dog);
});

dogRouter.post("/", async (req, res) => {
  const dogData = dogValidator(req.body);

  if (!dogData) return res.status(400).json({ status: 400, message: "Invalid dog data" });
  const createdDog = await DogsController.createDog(dogData);

  return res.status(201).json(createdDog);
});

dogRouter.delete("/:id", async (req, res) => {
  const deleteDogRes = await DogsController.deleteDog(req.params.id);

  if (!deleteDogRes) return res.status(404).json({ status: 404, message: "Dog not found" });
  return res.status(200).json(deleteDogRes);
});

dogRouter.put("/:id", async (req, res) => {
  const dogData = dogValidator(req.body);

  if (!dogData) return res.status(400).json({ status: 400, message: "Invalid dog data" });
  const updatedDog = await DogsController.updateDog(req.params.id, dogData);

  if (!updatedDog) return res.status(404).json({ status: 404, message: "Dog not found" });
  return res.status(200).json(updatedDog);
});

export {dogRouter}