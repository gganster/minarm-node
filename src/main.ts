import express from "express";
import * as DogsController from "./controllers/dogs.controller";
import { dogValidator } from "./types/dogs";
import fs from "node:fs/promises";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/dogs", async (req, res) => {
  const dogs = await DogsController.getDogs();
  return res.status(200).json(dogs);
});

app.get("/dogs/:id", async (req, res) => {
  const dog = await DogsController.getDogById(req.params.id);

  if (!dog) return res.status(404).json({ status: 404, message: "Dog not found" });
  return res.status(200).json(dog);
});

app.post("/dogs", async (req, res) => {
  const dogData = dogValidator(req.body);

  if (!dogData) return res.status(400).json({ status: 400, message: "Invalid dog data" });
  const createdDog = await DogsController.createDog(dogData);

  return res.status(201).json(createdDog);
});

app.delete("/dogs/:id", async (req, res) => {
  const deleteDogRes = await DogsController.deleteDog(req.params.id);

  if (!deleteDogRes) return res.status(404).json({ status: 404, message: "Dog not found" });
  return res.status(200).json(deleteDogRes);
});

app.put("/dogs/:id", async (req, res) => {
  const dogData = dogValidator(req.body);

  if (!dogData) return res.status(400).json({ status: 400, message: "Invalid dog data" });
  const updatedDog = await DogsController.updateDog(req.params.id, dogData);

  if (!updatedDog) return res.status(404).json({ status: 404, message: "Dog not found" });
  return res.status(200).json(updatedDog);
});

app.post("/tests/warmup", async (req, res) => {
  //if (!process.env.NODE_ENV) return res.status(400).json({ status: 400, message: "No test launch on prod" });

  await fs.writeFile("./dogs.json", "[]", "utf-8");
  return res.status(200).json({ status: 200, message: "Warmup done" });
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});