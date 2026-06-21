# dogapi

API REST de gestion de chiens (`Dog`) avec authentification JWT et upload de fichiers.
Stack : **Express 5 + TypeScript + Prisma 7 / PostgreSQL**, validation **Zod**, derrière **nginx** en production.

---

## 1. Démarrage

### Prérequis

- **Node.js 22+**
- **Docker** (pour la base PostgreSQL)

### Développement local

```bash
# 1. Dépendances
npm install

# 2. Démarrer PostgreSQL (Docker, exposé sur localhost:5432)
docker compose -f docker-compose.dev.yml up -d

# 3. Configuration : copier le modèle puis adapter .env
cp .env.template .env
#   - DATABASE_URL doit pointer vers la base de dev
#     (par défaut : postgres://dogapi:dogapi@localhost:5432/dogapi)
#   - définir JWT_SECRET (min. 16 caractères) :  openssl rand -hex 32

# 4. Appliquer les migrations + générer le client Prisma
npm run prisma:migrate

# 5. Lancer l'API en mode watch
npm run dev
```

L'API écoute sur `http://localhost:3000` (variable `PORT`). Vérifier : `GET http://localhost:3000/health` → `ok`.

> Le client Prisma est généré dans `src/generated/prisma` (git-ignoré). `prisma:migrate` le régénère ; sinon lancer `npm run prisma:generate` manuellement avant `typecheck`/`build`.

### Scripts utiles

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur en watch (tsx) |
| `npm run build` | Compilation TypeScript → `dist/` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` / `lint:fix` | ESLint |
| `npm run prisma:migrate` | Crée/applique une migration (dev, DB requise) |
| `npm run prisma:deploy` | Applique les migrations existantes (CI/prod) |
| `npm run prisma:generate` | Régénère le client Prisma |

> Il n'y a pas encore de suite de tests (`npm test` est un placeholder).

### Production (Docker)

```bash
# 1. Configurer .env avec des secrets FORTS
cp .env.template .env
#   - JWT_SECRET, POSTGRES_PASSWORD (obligatoires)
#   - CORS_ORIGIN = URL publique du frontend

# 2. Lancer la stack complète (postgres + app + nginx)
docker compose up -d --build
```

L'API est servie par nginx sur `http://localhost:${NGINX_PORT:-80}`. Au démarrage, le conteneur `app` applique les migrations (`prisma migrate deploy`) avant de lancer le serveur.

---

## 2. Architecture

### Vue d'ensemble

Flux d'une requête, des couches externes vers la base :

```
HTTP → [nginx] → routes → validation (Zod) → controller → service → Prisma → PostgreSQL
                                                   │
                                              (throw) → errorMiddleware
```

- **nginx** (prod uniquement) : seul point d'entrée exposé, reverse proxy + en-têtes de sécurité + rate-limiting réseau + limite de taille des corps.
- **routes** (`src/routes/`) : déclarent les endpoints et branchent les middlewares (validation, `auth`, rate-limit) avant chaque controller.
- **controllers** (`src/controllers/`) : fins — orchestrent la réponse HTTP et **lèvent** des erreurs ; ne construisent jamais eux-mêmes les réponses d'erreur.
- **services** (`src/services/`) : logique métier et **tout** l'accès Prisma (via le singleton `src/lib/prisma.ts`).
- **schemas** (`src/schemas/`) : schémas Zod, source de vérité des types d'entrée (`z.infer`).

### Arborescence

```
src/
├── main.ts              # point d'entrée : démarre le serveur HTTP (app.listen)
├── app.ts               # assemblage Express (middlewares + routes), exporté pour les tests
├── config/env.ts        # configuration validée au démarrage (@t3-oss/env-core + Zod)
├── lib/prisma.ts        # client Prisma (adapter PostgreSQL) — singleton
├── routes/              # dogs.routes.ts, users.routes.ts
├── controllers/         # dogs.controller.ts, users.controller.ts
├── services/            # dogs.service.ts, users.service.ts
├── schemas/             # dogs / users / utils (Zod)
├── middlewares/         # auth, validate, error, upload, logguer
├── types/               # http.ts (RequestWithBody), express.d.ts (augmentation Request)
└── generated/prisma/    # client Prisma généré (git-ignoré)
prisma/                  # schema.prisma + migrations (PostgreSQL)
nginx/                   # configuration du reverse proxy (prod)
tests/                   # suite d'intégration (node:test via tsx) — npm test
```

### Conventions clés

- **Gestion d'erreurs centralisée** : on **lève** `HttpError` / `NotFoundError` / `ForbiddenError` (`src/middlewares/error.ts`). Express 5 propage les rejets async vers `errorMiddleware`, qui mappe : `HttpError` → son statut, `ZodError` → 400, Prisma `P2002` → 409, `P2025` → 404, sinon 500.
- **Validation = réécriture de la requête** : `validateBody(schema)` remplace `req.body` par la valeur parsée ; `validateParams(schema)` écrit dans **`req.safeParams`** (et non `req.params`). Les controllers lisent `Number(req.safeParams.id)`.
- **Typage du corps** : convention manuelle `req: RequestWithBody<T>` (`src/types/http.ts`), à garder synchronisée avec le `validateBody(schema)` de la route.
- **Configuration** : tout passe par `src/config/env.ts` (validé au boot, le process échoue si l'env est invalide). Lire les réglages via `env` plutôt que `process.env`.
- **Authentification** : le middleware `auth` lit le header `Authorization` **brut** (sans préfixe `Bearer`) et le vérifie en HS256 ; il pose `req.user = { id }`. Les routes `/dogs` et `/upload` sont protégées ; `/auth` a un rate-limiter plus strict.

### Surface de l'API

| Méthode | Endpoint | Auth | Corps / notes |
|---|---|---|---|
| GET | `/health` | — | sonde de vie (`ok`) |
| POST | `/auth/signup` | — | `{ email, password }` |
| POST | `/auth/login` | — | `{ email, password }` → `{ jwt }` |
| GET | `/auth/verify` | header `Authorization` | valide le token |
| GET | `/dogs` | ✅ | liste |
| GET | `/dogs/:id` | ✅ | détail |
| POST | `/dogs` | ✅ | `{ name, active? }` |
| PUT | `/dogs/:id` | ✅ | `{ name, active? }` |
| DELETE | `/dogs/:id` | ✅ | suppression |
| POST | `/dogs/:id/upload` | ✅ | multipart, champ `attachment` (png/jpeg/gif/pdf) |
| GET | `/dogs/upload/:filename` | ✅ | sert un fichier uploadé — **propriétaire uniquement** |

### Base de données & déploiement

- **PostgreSQL uniquement** : `src/lib/prisma.ts` utilise le driver adapter `@prisma/adapter-pg` ; les migrations versionnées sont en dialecte Postgres (`prisma/migrations/`, baseline `0_init`).
- **Image Docker multi-étapes** (`Dockerfile`) : build (deps natives + `prisma generate` + `tsc`) puis runtime minimal exécuté en utilisateur non-root, avec `HEALTHCHECK`.
- **`docker-compose.yml`** (prod) orchestre `postgres` + `app` + `nginx` ; **`docker-compose.dev.yml`** ne lance que `postgres` pour le développement local.
