# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

REST API (Express 5 + TypeScript + Prisma 7 / PostgreSQL) exposing a `Dog` resource plus JWT auth (`User`) and file upload. CommonJS project run with `tsx` in dev and compiled with `tsc` for prod.

## Commands

```bash
npm run dev            # tsx watch (hot reload) — src/main.ts
npm start              # tsx without watch
npm run build          # tsc -> dist/, puis tsc-alias réécrit les alias @/ en chemins relatifs
npm run typecheck      # tsc --noEmit
npm run lint           # eslint .   (lint:fix to autofix)
npm test               # integration tests (node:test via tsx) — needs the dev DB up

npm run prisma:generate  # regenerate client into src/generated/prisma
npm run prisma:migrate   # prisma migrate dev  (creates a Postgres migration; needs a running DB)
npm run prisma:deploy    # prisma migrate deploy (CI/prod)
```

- **Integration tests** live in `tests/` (`*.test.ts`, Node's built-in `node:test` run via `tsx`). `npm test` runs `prisma migrate deploy` (pretest) then the suite against the **dev Postgres** (must be up). `tests/setup.mjs` is preloaded (`--import`) to set `NODE_ENV=test` and raise rate limits; each file boots the exported `app` (`src/app.ts`) on an ephemeral port and drives it with `fetch`.
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

- **Errors are thrown, not returned.** Throw `HttpError`/`NotFoundError`/`ForbiddenError` (`src/middlewares/error.ts`); Express 5 forwards async rejections to the central `errorMiddleware`, which maps `HttpError` → its status, `ZodError` → 400, `MulterError` → 413/400, Prisma `P2002` → 409, `P2025` → 404, else 500. Responses share the `{ status, message }` shape; only 5xx are logged (and nothing is logged when `NODE_ENV=test`). Do not add try/catch just to send error responses.
- **Validation rewrites the request.** `validateBody(schema)` replaces `req.body` with the parsed result; `validateParams(schema)` writes to **`req.safeParams`** (optional in the type). Controllers read the validated id via `requireParamId(req)` (`src/middlewares/validate.ts`), which 400s if `validateParams` was not wired.
- **Typed request bodies are a manual convention.** Controllers annotate `req: RequestWithBody<T>` (`src/types/http.ts`) where `T` is the Zod-inferred type; this is not inferred from the route, so keep the route's `validateBody(schema)` and the controller's `RequestWithBody<schemaType>` in sync.
- **`Request` is globally augmented** in `src/types/express.d.ts` (`req.user`, `req.safeParams`) — picked up via tsconfig `include`, no explicit import needed.
- **Auth token is the raw `Authorization` header** — `auth` middleware passes `req.headers.authorization` straight to `verifyJwt` (no `Bearer ` stripping). JWT `sub` is `String(id)`, read back as `Number(payload.sub)`; HS256 is pinned on sign and verify.
- **Path alias `@/*` → `src/*`.** Import cross-directory modules via `@/...` (e.g. `import { env } from "@/config/env"`), not `../`. Resolved by `tsx` (dev/test) and `tsc` (typecheck/`paths`); the prod build runs `tsc && tsc-alias` so emitted `dist/` JS has plain relative `require`s (`node dist/main.js` needs no path hook). Same-directory imports stay `./sibling`. Removing `tsc-alias` from `build` would ship `@/` requires that plain Node can't resolve.
- **All configuration goes through `src/config/env.ts`** (@t3-oss/env-core + Zod, validated at startup — the process throws on invalid env). Read tunables from the exported `env` (rate limits, `BCRYPT_ROUNDS`, `UPLOAD_MAX_SIZE`, `CORS_ORIGIN`, JWT settings); never read `process.env` directly in app code.

## Database

- **PostgreSQL only.** `src/lib/prisma.ts` uses the `@prisma/adapter-pg` driver adapter; `prisma/schema.prisma` datasource is hard-coded to `postgresql`.
- The generated client targets CommonJS (`moduleFormat = "cjs"`) and outputs to `src/generated/prisma` (git-ignored).
- **Migrations are Postgres-versioned.** `prisma/migrations/migration_lock.toml` is `postgresql`; baseline is `0_init`. After editing `schema.prisma`, run `npm run prisma:migrate` against a running Postgres (dev compose) to add a migration.

## App assembly & middleware order (src/app.ts)

`src/app.ts` builds and **exports** the Express `app` (no `listen`) so the test suite can mount it on an ephemeral port; `src/main.ts` only imports it and calls `app.listen`.

Order: `cors` → `helmet` → global `rateLimit` (skips `/health`) → `express.urlencoded`/`json` → `morgan` → routes → `errorMiddleware` (must stay last). CORS is first so 429s and preflights carry CORS headers; `helmet` (before the limiter) is the single source of security headers — nginx no longer duplicates them. `morgan` (`dev`/`combined`, skipped in test) replaced the custom `logguer`.

## Lint notes

ESLint flat config (`eslint.config.mjs`) runs **type-checked** rules on `src/**` (e.g. `no-floating-promises`). The `no-unsafe-*` rules and `require-await` are intentionally downgraded to `warn` (known debt: `req.body` is `any` until typed post-validation) — don't treat those warnings as new regressions.
