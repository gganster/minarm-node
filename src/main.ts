import "./types/express.d.ts";
import express from "express";
import { dogRouter } from "./routes/dogs.routes";
import {userRouter} from "./routes/users.routes.js";
import { logguer } from "./middlewares/logguer";
import { errorMiddleware } from "./middlewares/error";
import { rateLimit } from 'express-rate-limit'
import {auth} from "./middlewares/auth.js";

const app = express();

const limiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 500, 
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: (req) => req.path === '/health', // le healthcheck ne doit jamais être throttlé
    message: { error: 'Trop de requêtes, réessayez plus tard' },
})
app.use(limiter);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(logguer);

app.use("/dogs", auth, dogRouter);
app.use("/auth", userRouter)
app.get("/health", (req, res) => res.status(200).send("ok"))

app.use(errorMiddleware);

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});