import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import { startClient, teardown, type Client } from "./helpers";

let c: Client;
before(async () => { c = await startClient(); });
after(async () => { await teardown(c.server); });

// Helmet (configuré dans src/app.ts) pose les en-têtes de sécurité et retire
// X-Powered-By. On lit directement via fetch pour inspecter les en-têtes.
test("helmet pose les en-têtes de sécurité et retire X-Powered-By", async () => {
  const res = await fetch(c.base + "/health");
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("x-content-type-options"), "nosniff");
  assert.ok(res.headers.get("x-frame-options"), "X-Frame-Options présent");
  assert.equal(res.headers.get("x-dns-prefetch-control"), "off");
  assert.equal(res.headers.get("x-powered-by"), null, "X-Powered-By retiré par helmet");
  // CSP désactivée volontairement (API JSON + fichiers, pas de pages HTML).
  assert.equal(res.headers.get("content-security-policy"), null);
});

// Helmet est monté AVANT le rate-limiter et les routes : ses en-têtes doivent
// donc figurer même sur une réponse d'erreur (403 du guard `auth`).
test("les en-têtes helmet sont présents sur une réponse d'erreur (403)", async () => {
  const res = await fetch(c.base + "/dogs"); // sans token -> 403
  assert.equal(res.status, 403);
  assert.equal(res.headers.get("x-content-type-options"), "nosniff");
});
