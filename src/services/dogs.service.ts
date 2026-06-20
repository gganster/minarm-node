import { prisma } from "../lib/prisma";
import type { DogInput } from '../schemas/dogs.schema.ts';

// Toutes les lectures sont scoppées au propriétaire : un utilisateur ne voit
// (et ne peut donc cibler) que ses propres chiens. `getDogById` renvoie null
// pour un chien existant mais non possédé -> le controller répond 404 (pas de
// fuite d'existence / IDOR).
export const getDogs = async (ownerId: number) => await prisma.dog.findMany({where: {ownerId}});
export const getDogById = async (id: number, ownerId: number) => await prisma.dog.findFirst({where: {id, ownerId}});
export const createDog = async (data: DogInput, ownerId: number) => await prisma.dog.create({data: {...data, ownerId}});
// updateMany/deleteMany acceptent un `where` non-unique : on y inclut ownerId
// pour que la mutation elle-même soit atomiquement scoppée au propriétaire
// (renvoie {count} ; le controller mappe count === 0 -> 404).
export const updateDog = async (id: number, ownerId: number, data: Partial<DogInput>) => await prisma.dog.updateMany({where: {id, ownerId}, data});
export const deleteDog = async (id: number, ownerId: number) => await prisma.dog.deleteMany({where: {id, ownerId}});

// Lie un fichier uploadé (nom de fichier stocké dans uploads/) à un chien.
export const attachFileToDog = async (id: number, attachment: string) => await prisma.dog.update({where: {id}, data: {attachment}})