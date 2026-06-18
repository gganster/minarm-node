import express from "express";
import fs from "node:fs/promises";
import { dogRouter } from "./routes/dogs.routes";
import { logguer } from "./middlewares/logguer";
import { errorMiddleware } from "./middlewares/error";

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(logguer);

app.use("/dogs", dogRouter);

app.post("/tests/warmup", async (req, res) => {
  //if (!process.env.NODE_ENV) return res.status(400).json({ status: 400, message: "No test launch on prod" });

  await fs.writeFile("./dogs.json", "[]", "utf-8");
  return res.status(200).json({ status: 200, message: "Warmup done" });
});

app.use(errorMiddleware);

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});