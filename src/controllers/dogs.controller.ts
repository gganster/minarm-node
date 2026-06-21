import * as DogsService from "../services/dogs.service"
import type { Request, Response, NextFunction } from "express";
import type { RequestWithBody } from "../types/http";
import type { DogInput } from "../schemas/dogs.schema";
import { HttpError, NotFoundError } from "../middlewares/error";
import { requireUserId } from "../middlewares/auth";
import { requireParamId } from "../middlewares/validate";
import { UPLOADS_DIR } from "../lib/uploads";
import fs from "node:fs";
import path from "node:path";

export const listDogs = async (req: Request, res: Response) => res.json(await DogsService.getDogs(requireUserId(req)))

export const getDog = async (req: Request, res: Response) => {
  const ownerId = requireUserId(req);
  const id = requireParamId(req);
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
  const id = requireParamId(req);
  // Mutation scoppée au propriétaire : count === 0 => le chien n'existe pas OU
  // n'appartient pas au caller -> 404 (pas de fuite d'existence).
  const { count } = await DogsService.updateDog(id, ownerId, req.body);

  if (!count) throw new NotFoundError;
  const updatedDog = await DogsService.getDogById(id, ownerId);

  return res.status(200).json(updatedDog)
}

export const deleteDog = async (req: Request, res: Response) => {
  const ownerId = requireUserId(req);
  const id = requireParamId(req);
  // On charge d'abord le chien possédé (pour le renvoyer après suppression) ;
  // deleteDog reste lui aussi scoppé par ownerId.
  const dog = await DogsService.getDogById(id, ownerId);

  if (!dog) throw new NotFoundError;
  await DogsService.deleteDog(id, ownerId);

  // Ligne supprimée -> on retire sa pièce jointe orpheline du disque (best
  // effort ; le `.catch` évite qu'un échec de suppression masque la réponse).
  // NB : la suppression en cascade d'un utilisateur (onDelete: Cascade) n'est
  // pas exposée par l'API, donc non couverte ici.
  if (dog.attachment) {
    await fs.promises.unlink(path.join(UPLOADS_DIR, dog.attachment)).catch(() => undefined);
  }

  return res.status(200).json(dog)
}

export const upload = async (req: Request, res: Response) => {
  const ownerId = requireUserId(req);
  const id = requireParamId(req);

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
    // Liaison scoppée au propriétaire (updateMany -> {count}) : count === 0
    // signifie que le chien a été supprimé entre-temps -> 404. On re-lit ensuite
    // pour renvoyer l'état à jour.
    const { count } = await DogsService.attachFileToDog(id, ownerId, req.file.filename);
    if (!count) throw new NotFoundError;
    updatedDog = await DogsService.getDogById(id, ownerId);
  } catch (err) {
    // Échec après l'écriture (chien supprimé en concurrence, panne DB…) :
    // on ne laisse pas le fichier fraîchement écrit derrière nous.
    await fs.promises.unlink(newFilePath).catch(() => undefined);
    throw err;
  }

  // Remplacement réussi : l'ancien fichier n'est plus référencé, on le supprime.
  if (dog.attachment && dog.attachment !== req.file.filename) {
    await fs.promises.unlink(path.join(UPLOADS_DIR, dog.attachment)).catch(() => undefined);
  }

  return res.status(200).json(updatedDog);
}

// Sert un fichier uploadé, scoppé au propriétaire : le fichier n'est renvoyé que
// s'il est référencé par un chien appartenant au caller. L'authentification
// seule ne suffisait pas (tout utilisateur authentifié connaissant le nom
// pouvait lire le fichier d'un autre) -> on ajoute l'autorisation (S1).
export const serveAttachment = async (req: Request, res: Response, next: NextFunction) => {
  const ownerId = requireUserId(req);
  // basename neutralise toute tentative de path traversal ("../") avant la
  // recherche ; le nom est de toute façon comparé à la valeur stockée en base.
  // (req.params.filename est string | string[] côté types Express 5 ; pour un
  // param simple il est toujours string au runtime, on traite l'array -> 404.)
  const rawName = req.params.filename;
  const filename = path.basename(Array.isArray(rawName) ? "" : rawName);

  const dog = await DogsService.getDogByAttachment(filename, ownerId);
  if (!dog) throw new NotFoundError;

  // Fichier référencé en base mais absent du disque (suppression hors-bande,
  // race) -> 404 cohérent plutôt que le 500 générique d'errorMiddleware.
  res.sendFile(path.join(UPLOADS_DIR, filename), (err) => {
    if (!err) return;
    const code = (err as NodeJS.ErrnoException).code;
    next(code === "ENOENT" ? new NotFoundError : err);
  });
}
