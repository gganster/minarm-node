# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

REST API (Express 5 + TypeScript + Prisma 7 / PostgreSQL) exposing a `Dog` resource plus JWT auth (`User`) and file upload. CommonJS project run with `tsx` in dev and compiled with `tsc` for prod.

## Commands

```bash
npm run dev            # tsx watch (hot reload) — src/main.ts
npm start              # tsx without watch
npm run build          # tsc -> dist/
npm run typecheck      # tsc --noEmit
npm run lint           # eslint .   (lint:fix to autofix)

npm run prisma:generate  # regenerate client into src/generated/prisma
npm run prisma:migrate   # prisma migrate dev  (creates a Postgres migration; needs a running DB)
npm run prisma:deploy    # prisma migrate deploy (CI/prod)
```

- **No test suite exists** — `npm test` is a placeholder that exits 1.
- **The Prisma client is git-ignored and must be generated** (`npm run prisma:generate`) before `typecheck`/`build`/running, otherwise imports from `src/generated/prisma` break.
- **Local dev DB**: `docker compose -f docker-compose.dev.yml up -d` (Postgres on `localhost:5432`). Then `cp .env.template .env`.
- **Prod stack**: `docker compose up -d --build` (postgres + app + nginx). The `app` container runs `prisma migrate deploy` on boot before starting the API (see `Dockerfile` CMD).

## Request flow & layering

`routes → validation middleware → controller → service → prisma`

- **Routes** (`src/routes/`) wire Zod validation middleware before each controller. Auth-protected groups mount the `auth` middleware (`/dogs`, `/upload`); `/auth` gets a stricter `authLimiter`.
- **Controllers** (`src/controllers/`) are thin: orchestrate the HTTP response and **throw** on errors — they never build error responses themselves.
- **Services** (`src/services/`) hold all Prisma access and domain logic. Import the shared singleton `prisma` from `src/lib/prisma.ts`.
- **Schemas** (`src/schemas/`) are the source of truth for input types via `z.infer` (e.g. `DogInput`, `SignupInput`).

## Key conventions (non-obvious)

- **Errors are thrown, not returned.** Throw `HttpError`/`NotFoundError`/`ForbiddenError` (`src/middlewares/error.ts`); Express 5 forwards async rejections to the central `errorMiddleware`, which maps `HttpError` → its status, `ZodError` → 400, Prisma `P2002` → 409, `P2025` → 404, else 500. Do not add try/catch just to send error responses.
- **Validation rewrites the request.** `validateBody(schema)` replaces `req.body` with the parsed result; `validateParams(schema)` writes to **`req.safeParams`** (not `req.params`). Controllers read params via `Number(req.safeParams.id)`.
- **Typed request bodies are a manual convention.** Controllers annotate `req: RequestWithBody<T>` (`src/types/http.ts`) where `T` is the Zod-inferred type; this is not inferred from the route, so keep the route's `validateBody(schema)` and the controller's `RequestWithBody<schemaType>` in sync.
- **`Request` is globally augmented** in `src/types/express.d.ts` (`req.user`, `req.safeParams`) — picked up via tsconfig `include`, no explicit import needed.
- **Auth token is the raw `Authorization` header** — `auth` middleware passes `req.headers.authorization` straight to `verifyJwt` (no `Bearer ` stripping). JWT `sub` is `String(id)`, read back as `Number(payload.sub)`; HS256 is pinned on sign and verify.
- **All configuration goes through `src/config/env.ts`** (@t3-oss/env-core + Zod, validated at startup — the process throws on invalid env). Read tunables from the exported `env` (rate limits, `BCRYPT_ROUNDS`, `UPLOAD_MAX_SIZE`, `CORS_ORIGIN`, JWT settings); never read `process.env` directly in app code.

## Database

- **PostgreSQL only.** `src/lib/prisma.ts` uses the `@prisma/adapter-pg` driver adapter; `prisma/schema.prisma` datasource is hard-coded to `postgresql`.
- The generated client targets CommonJS (`moduleFormat = "cjs"`) and outputs to `src/generated/prisma` (git-ignored).
- **Migrations are Postgres-versioned.** `prisma/migrations/migration_lock.toml` is `postgresql`; baseline is `0_init`. After editing `schema.prisma`, run `npm run prisma:migrate` against a running Postgres (dev compose) to add a migration.

## Middleware order (src/main.ts)

`cors` → global `rateLimit` (skips `/health`) → `express.urlencoded`/`json` → `logguer` → routes → `errorMiddleware` (must stay last). CORS is first so 429s and preflights carry CORS headers.

## Lint notes

ESLint flat config (`eslint.config.mjs`) runs **type-checked** rules on `src/**` (e.g. `no-floating-promises`). The `no-unsafe-*` rules and `require-await` are intentionally downgraded to `warn` (known debt: `req.body` is `any` until typed post-validation) — don't treat those warnings as new regressions.
