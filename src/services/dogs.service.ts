import { prisma } from "../lib/prisma";
import type { DogInput } from '../schemas/dogs.schema.ts';

// Toutes les lectures sont scoppées au propriétaire : un utilisateur ne voit
// (et ne peut donc cibler) que ses propres chiens. `getDogById` renvoie null
// pour un chien existant mais non possédé -> le controller répond 404 (pas de
// fuite d'existence / IDOR).
export const getDogs = async (ownerId: number) => await prisma.dog.findMany({where: {ownerId}});
export const getDogById = async (id: number, ownerId: number) => await prisma.dog.findFirst({where: {id, ownerId}});
// Retrouve le chien référençant cette pièce jointe, scoppé au propriétaire :
// sert à autoriser l'accès au fichier (un user ne lit que SES pièces jointes).
export const getDogByAttachment = async (attachment: string, ownerId: number) => await prisma.dog.findFirst({where: {attachment, ownerId}});
export const createDog = async (data: DogInput, ownerId: number) => await prisma.dog.create({data: {...data, ownerId}});
// updateMany/deleteMany acceptent un `where` non-unique : on y inclut ownerId
// pour que la mutation elle-même soit atomiquement scoppée au propriétaire
// (renvoie {count} ; le controller mappe count === 0 -> 404).
export const updateDog = async (id: number, ownerId: number, data: Partial<DogInput>) => await prisma.dog.updateMany({where: {id, ownerId}, data});
export const deleteDog = async (id: number, ownerId: number) => await prisma.dog.deleteMany({where: {id, ownerId}});

// Lie un fichier uploadé (nom stocké dans uploads/) à un chien, scoppé au
// propriétaire comme update/delete (updateMany {where:{id, ownerId}} -> {count} ;
// le controller mappe count === 0 -> 404). Cohérent avec le reste du service.
export const attachFileToDog = async (id: number, ownerId: number, attachment: string) => await prisma.dog.updateMany({where: {id, ownerId}, data: {attachment}})