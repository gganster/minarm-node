# syntax=docker/dockerfile:1

# ============================================================
# Étape 1 — build : install des deps, génération du client Prisma (pour Postgres)
# puis compilation TypeScript src/ -> dist/.
# bcrypt/better-sqlite3 embarquent des addons natifs (python3/make/g++ sur Alpine/musl).
# ============================================================
FROM node:22-alpine AS build
WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

# L'image cible Postgres : on aligne le provider du schéma puis on génère le
# client Prisma pour ce dialecte (le client généré est spécifique au moteur).
ENV DATABASE_PROVIDER=postgresql
COPY tsconfig.json prisma.config.ts ./
COPY src ./src
RUN npm run prisma:generate
RUN npm run build

# ============================================================
# Étape 2 — runtime : image finale exécutée par un utilisateur non-root.
# On conserve le CLI Prisma (node_modules) pour synchroniser le schéma au
# démarrage via `prisma db push` (en vrai projet : `prisma migrate deploy`).
# ============================================================
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

RUN addgroup -S nodeapp && adduser -S nodeapp -G nodeapp

COPY --from=build --chown=nodeapp:nodeapp /app/node_modules ./node_modules
COPY --from=build --chown=nodeapp:nodeapp /app/dist ./dist
COPY --from=build --chown=nodeapp:nodeapp /app/prisma ./prisma
COPY --from=build --chown=nodeapp:nodeapp /app/prisma.config.ts ./
COPY --chown=nodeapp:nodeapp package*.json ./

RUN mkdir -p /app/uploads && chown -R nodeapp:nodeapp /app/uploads

USER nodeapp
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/health || exit 1

# Aligne le provider du schéma sur DATABASE_PROVIDER, synchronise le schéma
# (crée la base/les tables si besoin) PUIS démarre l'API compilée.
CMD ["sh", "-c", "node prisma/set-provider.mjs && npx prisma db push && node dist/main.js"]
