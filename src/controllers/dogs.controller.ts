import type {Dog, DogWithoutId} from '../types/dogs.ts';
import fs from "node:fs/promises";
import { prisma } from "../lib/prisma";

const FILEPATH = "./dogs.json";

export const getDogs = async () => JSON.parse(await fs.readFile(FILEPATH, "utf-8")) as Dog[];

export const getDogById = async (id: string) => (await getDogs()).find(dog => dog.id === id);

export const createDog = async (data: DogWithoutId) => {
  const newDog = await prisma.dog.create({data});
  console.log(newDog);
  return newDog;
}

export const deleteDog = async (id: string) => {
  let dogs = await getDogs();
  const dog = dogs.find(dog => dog.id === id);

  if (!dog) return null;
  dogs = dogs.filter(dog => dog.id !== id);

  await fs.writeFile(FILEPATH, JSON.stringify(dogs, null, 2), "utf-8");
  return dog;
}

export const updateDog = async (id: string, data: Partial<DogWithoutId>) => {
  let dogs = await getDogs();
  const oldDog = dogs.find(dog => dog.id === id);

  if (!oldDog) return null;
  const updatedDog = {...oldDog, ...data};

  dogs = dogs.map(dog => dog.id === id ? updatedDog : dog);
  await fs.writeFile(FILEPATH, JSON.stringify(dogs, null, 2), "utf-8");

  return updatedDog;
}