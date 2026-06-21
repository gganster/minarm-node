import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { app } from "../src/app";
import { prisma } from "../src/lib/prisma";

// NB : l'import de `app`/`prisma` déclenche l'évaluation de src/config/env.ts.
// tests/setup.mjs (préchargé via --import) a déjà posé NODE_ENV et les rate-limits
// à ce stade, donc l'app de test est configurée correctement.

export { prisma };

export const PASSWORD = "password123";

/** Identifiant aléatoire court pour générer des emails uniques par test. */
export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export interface ApiResponse {
  status: number;
  // Corps JSON parsé (ou texte brut si non-JSON).
  data: any;
}

export type RequestFn = (
  method: string,
  path: string,
  opts?: { token?: string; json?: unknown; form?: FormData }
) => Promise<ApiResponse>;

export interface Client {
  base: string;
  server: Server;
  req: RequestFn;
}

// Emails créés via `signup`, supprimés en fin de fichier (cascade -> dogs).
const createdEmails: string[] = [];

/** Monte l'app sur un port éphémère et renvoie un client HTTP prêt à l'emploi. */
export function startClient(): Promise<Client> {
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      const { port } = server.address() as AddressInfo;
      const base = `http://127.0.0.1:${port}`;

      const req: RequestFn = async (method, path, opts = {}) => {
        const headers: Record<string, string> = {};
        // Le projet passe l'en-tête Authorization brut (pas de préfixe "Bearer ").
        if (opts.token) headers.authorization = opts.token;

        let body: BodyInit | undefined;
        if (opts.json !== undefined) {
          headers["content-type"] = "application/json";
          body = JSON.stringify(opts.json);
        }
        if (opts.form) body = opts.form; // fetch pose lui-même le content-type multipart

        const res = await fetch(base + path, { method, headers, body });
        const text = await res.text();
        let data: any;
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }
        return { status: res.status, data };
      };

      resolve({ base, server, req });
    });
  });
}

/** Crée un utilisateur valide et renvoie son token (et l'email normalisé). */
export async function signup(
  req: RequestFn,
  prefix = "user"
): Promise<{ email: string; token: string; res: ApiResponse }> {
  const email = `${prefix}_${uid()}@example.com`;
  const res = await req("POST", "/auth/signup", { json: { email, password: PASSWORD } });
  if (res.status === 201) createdEmails.push(email);
  return { email, token: res.data?.jwt as string, res };
}

/** Enregistre un email créé hors `signup` pour le nettoyage final. */
export function trackEmail(email: string): void {
  createdEmails.push(email);
}

/** Supprime les utilisateurs créés, ferme le serveur et déconnecte Prisma. */
export async function teardown(server: Server): Promise<void> {
  if (createdEmails.length) {
    await prisma.user.deleteMany({ where: { email: { in: createdEmails } } });
    createdEmails.length = 0;
  }
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await prisma.$disconnect();
}
