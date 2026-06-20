import * as DogsService from "../services/dogs.service"
import type { Request, Response } from "express";
import type { RequestWithBody } from "../types/http";
import type { DogInput } from "../schemas/dogs.schema";
import { HttpError, NotFoundError } from "../middlewares/error";
import { requireUserId } from "../middlewares/auth";
import fs from "node:fs";
import path from "node:path";

export const listDogs = async (req: Request, res: Response) => res.json(await DogsService.getDogs(requireUserId(req)))

export const getDog = async (req: Request, res: Response) => {
  const ownerId = requireUserId(req);
  const id = Number(req.safeParams.id);
  const dog = await DogsService.getDogById(id, ownerId);

  if (!dog) throw new NotFoundError;
  return res.status(200).json(dog);
}

export const createDog = async (req: RequestWithBody<DogInput>, res: Response) => {
  const createdDog = await DogsService.createDog(req.body, requireUserId(req));
  return res.status(201).json(createdDog);
}

export const updateDog = async (req: RequestWithBody<DogInput>, res: Response) => {
  const ownerId = requireUserId(req);
  const id = Number(req.safeParams.id);
  // Mutation scoppée au propriétaire : count === 0 => le chien n'existe pas OU
  // n'appartient pas au caller -> 404 (pas de fuite d'existence).
  const { count } = await DogsService.updateDog(id, ownerId, req.body);

  if (!count) throw new NotFoundError;
  const updatedDog = await DogsService.getDogById(id, ownerId);

  return res.status(200).json(updatedDog)
}

export const deleteDog = async (req: Request, res: Response) => {
  const ownerId = requireUserId(req);
  const id = Number(req.safeParams.id);
  // On charge d'abord le chien possédé (pour le renvoyer après suppression) ;
  // deleteDog reste lui aussi scoppé par ownerId.
  const dog = await DogsService.getDogById(id, ownerId);

  if (!dog) throw new NotFoundError;
  await DogsService.deleteDog(id, ownerId);

  return res.status(200).json(dog)
}

export const upload = async (req: Request, res: Response) => {
  const ownerId = requireUserId(req);
  const id = Number(req.safeParams.id);

  if (!req.file) throw new HttpError(400, "Aucun fichier fourni");

  // multer a déjà écrit le fichier sur disque. Tout chemin qui n'aboutit pas à
  // une liaison réussie doit supprimer cet orphelin (le `.catch` évite qu'un
  // échec de suppression masque l'erreur d'origine).
  const newFilePath = req.file.path;
  const dog = await DogsService.getDogById(id, ownerId);

  if (!dog) {
    await fs.promises.unlink(newFilePath).catch(() => undefined);
    throw new NotFoundError;
  }

  let updatedDog;
  try {
    updatedDog = await DogsService.attachFileToDog(id, req.file.filename);
  } catch (err) {
    // Échec après l'écriture (chien supprimé en concurrence -> P2025, panne DB…) :
    // on ne laisse pas le fichier fraîchement écrit derrière nous.
    await fs.promises.unlink(newFilePath).catch(() => undefined);
    throw err;
  }

  // Remplacement réussi : l'ancien fichier n'est plus référencé, on le supprime.
  if (dog.attachment && dog.attachment !== req.file.filename) {
    await fs.promises.unlink(path.join("uploads", dog.attachment)).catch(() => undefined);
  }

  return res.status(200).json(updatedDog);
}
