import express from "express";
import { dogRouter } from "./routes/dogs.routes";
import {userRouter} from "./routes/users.routes.js";
import { logguer } from "./middlewares/logguer";
import { errorMiddleware } from "./middlewares/error";
import { rateLimit } from 'express-rate-limit'
import {auth} from "./middlewares/auth.js";
import cors from "cors";
import { env } from "./config/env";

const app = express();

// CORS en tout premier : les en-têtes CORS doivent être posés sur TOUTES les
// réponses (y compris les 429 du rate-limiter) et les préflights OPTIONS doivent
// être court-circuités avant de consommer le quota de rate-limiting.
// CORS_ORIGIN accepte une ou plusieurs origines séparées par des virgules.
const corsOrigins = env.CORS_ORIGIN.split(",").map((o) => o.trim());
app.use(cors({ origin: corsOrigins.length === 1 ? corsOrigins[0] : corsOrigins }));

const limiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    limit: env.RATE_LIMIT_MAX,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: (req) => req.path === '/health', // le healthcheck ne doit jamais être throttlé
    message: { error: 'Trop de requêtes, réessayez plus tard' },
})
app.use(limiter);

// Limiteur dédié, plus strict, sur les routes d'authentification (anti brute-force).
const authLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    limit: env.AUTH_RATE_LIMIT_MAX,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Trop de tentatives, réessayez plus tard' },
})

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(logguer);

app.use("/dogs", auth, dogRouter);
app.use("/auth", authLimiter, userRouter)
app.use("/upload", auth, express.static("uploads"));
app.get("/health", (req, res) => res.status(200).send("ok"))

app.use(errorMiddleware);

app.listen(env.PORT, () => {
  console.log(`Server is running on port ${env.PORT}`);
});