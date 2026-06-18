import { prisma } from "../lib/prisma";
import type { DogInput } from '../schemas/dogs.schema.ts';

export const getDogs = async () => await prisma.dog.findMany();
export const getDogById = async (id: number) => await prisma.dog.findUnique({where: {id}});
export const createDog = async (data: DogInput) => await prisma.dog.create({data});
export const deleteDog = async (id: number) => await prisma.dog.delete({where: {id}});
export const updateDog = async (id: number, data: Partial<DogInput>) => await prisma.dog.update({where: {id}, data})