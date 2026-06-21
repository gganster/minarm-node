import express from "express";
import { dogRouter } from "@/routes/dogs.routes";
import {userRouter} from "@/routes/users.routes.js";
import { errorMiddleware } from "@/middlewares/error";
import { rateLimit } from 'express-rate-limit'
import {auth} from "@/middlewares/auth.js";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import { env } from "@/config/env";

// Construction de l'app Express SANS `listen` : exportée pour que la suite de
// tests d'intégration (tests/) puisse la monter sur un port éphémère. Le
// démarrage réseau est dans `main.ts` (point d'entrée prod/dev).
export const app = express();

// Derrière nginx (prod) : faire confiance au 1er proxy pour que `req.ip` soit
// l'IP réelle du client. Indispensable au rate-limiting per-IP (sinon tout le
// trafic est compté sous l'IP du conteneur nginx). La conf nginx ÉCRASE
// X-Forwarded-For avec $remote_addr, ce qui empêche le spoofing de l'en-tête.
app.set("trust proxy", 1);

// CORS en tout premier : les en-têtes CORS doivent être posés sur TOUTES les
// réponses (y compris les 429 du rate-limiter) et les préflights OPTIONS doivent
// être court-circuités avant de consommer le quota de rate-limiting.
// CORS_ORIGIN accepte une ou plusieurs origines séparées par des virgules.
const corsOrigins = env.CORS_ORIGIN.split(",").map((o) => o.trim());
app.use(cors({ origin: corsOrigins.length === 1 ? corsOrigins[0] : corsOrigins }));

// Helmet pose les en-têtes de sécurité HTTP (X-Content-Type-Options,
// X-Frame-Options, Referrer-Policy, HSTS…) et retire X-Powered-By. Placé avant le
// rate-limiter pour que même les réponses 429 en bénéficient. Ces en-têtes
// applicatifs sont la source de vérité unique (nginx ne les duplique plus, ce qui
// évitait un conflit sur X-XSS-Protection). CSP désactivée : l'API ne sert que du
// JSON et des fichiers, pas de pages HTML à protéger.
app.use(helmet({ contentSecurityPolicy: false }));

const limiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    limit: env.RATE_LIMIT_MAX,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: (req) => req.path === '/health', // le healthcheck ne doit jamais être throttlé
    message: { status: 429, message: 'Trop de requêtes, réessayez plus tard' },
})
app.use(limiter);

// Limiteur dédié, plus strict, sur les routes d'authentification (anti brute-force).
const authLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    limit: env.AUTH_RATE_LIMIT_MAX,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { status: 429, message: 'Trop de tentatives, réessayez plus tard' },
})

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Journalisation HTTP : `dev` (concis/coloré) en dev, `combined` (avec l'IP réelle
// résolue via `trust proxy`) en prod, muet en test. Remplace l'ancien `logguer`.
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev", {
  skip: () => env.NODE_ENV === "test",
}));

app.use("/dogs", auth, dogRouter);
app.use("/auth", authLimiter, userRouter)
app.get("/health", (_req, res) => res.status(200).send("ok"))

app.use(errorMiddleware);
