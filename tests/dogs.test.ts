import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import { startClient, signup, teardown, type Client } from "./helpers";

let c: Client;
before(async () => { c = await startClient(); });
after(async () => { await teardown(c.server); });

// ---------------------------------------------------------------------------
// Auth guard (le router /dogs est monté derrière le middleware `auth`)
// ---------------------------------------------------------------------------
test("GET /dogs sans token -> 403 {status,message}", async () => {
  const r = await c.req("GET", "/dogs");
  assert.equal(r.status, 403);
  assert.equal(r.data.status, 403);
  assert.equal(typeof r.data.message, "string");
});

test("GET /dogs token invalide -> 403", async () => {
  const r = await c.req("GET", "/dogs", { token: "jeton.bidon" });
  assert.equal(r.status, 403);
});

// ---------------------------------------------------------------------------
// CRUD complet
// ---------------------------------------------------------------------------
test("POST /dogs puis GET /dogs (liste scopée au propriétaire)", async () => {
  const { token } = await signup(c.req, "dog");

  const empty = await c.req("GET", "/dogs", { token });
  assert.equal(empty.status, 200);
  assert.deepEqual(empty.data, []);

  const created = await c.req("POST", "/dogs", { token, json: { name: "Rex", active: true } });
  assert.equal(created.status, 201);
  assert.equal(created.data.name, "Rex");
  assert.equal(created.data.active, true);
  assert.equal(typeof created.data.ownerId, "number");

  const list = await c.req("GET", "/dogs", { token });
  assert.equal(list.status, 200);
  assert.equal(list.data.length, 1);
  assert.equal(list.data[0].id, created.data.id);
});

test("POST /dogs corps invalide (nom manquant) -> 400", async () => {
  const { token } = await signup(c.req, "dog");
  const r = await c.req("POST", "/dogs", { token, json: { active: true } });
  assert.equal(r.status, 400);
});

test("GET /dogs/:id -> 200 / id non numérique -> 400 / inexistant -> 404", async () => {
  const { token } = await signup(c.req, "dog");
  const created = await c.req("POST", "/dogs", { token, json: { name: "Médor" } });
  const id = created.data.id;

  const ok = await c.req("GET", `/dogs/${id}`, { token });
  assert.equal(ok.status, 200);
  assert.equal(ok.data.id, id);

  const bad = await c.req("GET", "/dogs/abc", { token });
  assert.equal(bad.status, 400, "validateParams rejette un id non entier");

  const missing = await c.req("GET", "/dogs/999999999", { token });
  assert.equal(missing.status, 404);
});

test("PUT /dogs/:id -> 200 (mise à jour) / inexistant -> 404", async () => {
  const { token } = await signup(c.req, "dog");
  const created = await c.req("POST", "/dogs", { token, json: { name: "Rex", active: true } });
  const id = created.data.id;

  const updated = await c.req("PUT", `/dogs/${id}`, { token, json: { name: "RexV2", active: false } });
  assert.equal(updated.status, 200);
  assert.equal(updated.data.name, "RexV2");
  assert.equal(updated.data.active, false);

  const missing = await c.req("PUT", "/dogs/999999999", { token, json: { name: "X", active: true } });
  assert.equal(missing.status, 404);
});

test("DELETE /dogs/:id -> 200 puis 404", async () => {
  const { token } = await signup(c.req, "dog");
  const created = await c.req("POST", "/dogs", { token, json: { name: "Rex" } });
  const id = created.data.id;

  const del = await c.req("DELETE", `/dogs/${id}`, { token });
  assert.equal(del.status, 200);

  const after = await c.req("GET", `/dogs/${id}`, { token });
  assert.equal(after.status, 404);
});

// ---------------------------------------------------------------------------
// IDOR : un utilisateur ne peut ni lire ni muter les chiens d'un autre
// ---------------------------------------------------------------------------
test("IDOR : user2 ne peut pas accéder au chien de user1 (404, pas de fuite)", async () => {
  const { token: t1 } = await signup(c.req, "owner");
  const { token: t2 } = await signup(c.req, "intrus");
  const created = await c.req("POST", "/dogs", { token: t1, json: { name: "Privé" } });
  const id = created.data.id;

  assert.equal((await c.req("GET", `/dogs/${id}`, { token: t2 })).status, 404);
  assert.equal((await c.req("PUT", `/dogs/${id}`, { token: t2, json: { name: "hack", active: true } })).status, 404);
  assert.equal((await c.req("DELETE", `/dogs/${id}`, { token: t2 })).status, 404);

  // user1 voit toujours son chien intact.
  const still = await c.req("GET", `/dogs/${id}`, { token: t1 });
  assert.equal(still.status, 200);
  assert.equal(still.data.name, "Privé");
});
