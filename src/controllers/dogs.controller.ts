import * as DogsService from "../services/dogs.service"
import type { Request, Response } from "express";
import { dogValidator } from "../types/dogs";
import { HttpError } from "../middlewares/error";

export const listDogs = async (req: Request, res: Response) => res.json(await DogsService.getDogs())

export const getDog = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (Number.isNaN(id)) return res.status(400).json({status: 400, message: "non valid id"});
  const dog = await DogsService.getDogById(id);

  if (!dog) return res.status(404).json({status: 404, message: "dog not found"});
  return res.status(200).json(dog);
}

export const createDog = async (req: Request, res: Response) => {
  const createdDog = await DogsService.createDog(req.body);
  return res.status(201).json(createdDog);
}

export const updateDog = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const dogData = dogValidator(req.body);

  if (Number.isNaN(id)) return res.status(400).json({status: 400, message: "non valid id"});
  if (!dogData) return res.status(400).json({ status: 400, message: "Invalid dog data" });

  const dog = await DogsService.getDogById(id);

  if (!dog) return res.status(404).json({status: 404, message: "dog not found"});
  const updatedDog = await DogsService.updateDog(id, dogData);

  return res.status(200).json(updatedDog)
}

export const deleteDog = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (Number.isNaN(id)) return res.status(400).json({status: 400, message: "non valid id"});
  const dog = await DogsService.getDogById(id);

  if (!dog) return res.status(404).json({status: 404, message: "dog not found"});
  const deletedDog = await DogsService.deleteDog(id);

  return res.status(200).json(deletedDog)

}