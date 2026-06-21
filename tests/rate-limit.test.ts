import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import { startClient, teardown, type Client } from "./helpers";

// Fichier isolé (node:test exécute chaque fichier dans son propre process, donc
// avec un compteur de rate-limit neuf). tests/setup.mjs fixe AUTH_RATE_LIMIT_MAX=30.
// On envoie des corps invalides : la validation 400 vient APRÈS le limiteur, donc
// chaque requête consomme bien le quota sans payer le coût bcrypt d'un vrai login.
let c: Client;
before(async () => { c = await startClient(); });
after(async () => { await teardown(c.server); });

test("le limiteur /auth renvoie 429 {status,message} une fois le quota dépassé", async () => {
  let got429: { status: number; data: any } | null = null;

  for (let i = 0; i < 45; i++) {
    const r = await c.req("POST", "/auth/login", { json: {} });
    if (r.status === 429) { got429 = r; break; }
  }

  assert.ok(got429, "le 429 doit être déclenché après ~30 requêtes /auth");
  assert.equal(got429.data.status, 429);
  assert.equal(typeof got429.data.message, "string");
});
