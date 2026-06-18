import type {Dog, DogWithoutId} from '../types/dogs.ts';
import { prisma } from "../lib/prisma";

export const getDogs = async () => await prisma.dog.findMany();
export const getDogById = async (id: number) => await prisma.dog.findUnique({where: {id}});
export const createDog = async (data: DogWithoutId) => await prisma.dog.create({data});
export const deleteDog = async (id: number) => await prisma.dog.delete({where: {id}});
export const updateDog = async (id: number, data: Partial<DogWithoutId>) => await prisma.dog.update({where: {id}, data})