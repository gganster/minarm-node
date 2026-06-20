import * as DogsService from "../services/dogs.service"
import type { Request, Response } from "express";
import type { RequestWithBody } from "../types/http";
import type { DogInput } from "../schemas/dogs.schema";
import { NotFoundError } from "../middlewares/error";

export const listDogs = async (req: Request, res: Response) => res.json(await DogsService.getDogs())

export const getDog = async (req: Request, res: Response) => {
  console.log(req.user)
  const id = Number(req.safeParams.id);
  const dog = await DogsService.getDogById(id);

  if (!dog) throw new NotFoundError;
  return res.status(200).json(dog);
}

export const createDog = async (req: RequestWithBody<DogInput>, res: Response) => {
  const createdDog = await DogsService.createDog(req.body);
  return res.status(201).json(createdDog);
}

export const updateDog = async (req: RequestWithBody<DogInput>, res: Response) => {
  const id = Number(req.safeParams.id);
  const dog = await DogsService.getDogById(id);

  if (!dog) throw new NotFoundError;
  const updatedDog = await DogsService.updateDog(id, req.body);

  return res.status(200).json(updatedDog)
}

export const deleteDog = async (req: Request, res: Response) => {
  const id = Number(req.safeParams.id);
  const dog = await DogsService.getDogById(id);

  if (!dog) throw new NotFoundError;
  const deletedDog = await DogsService.deleteDog(id);

  return res.status(200).json(deletedDog)
}

export const upload = (req: Request, res: Response) => {
  console.log(req.file);
  res.status(200).send("ok");
}
