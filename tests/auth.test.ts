import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import { startClient, signup, teardown, trackEmail, uid, PASSWORD, type Client } from "./helpers";

let c: Client;
before(async () => { c = await startClient(); });
after(async () => { await teardown(c.server); });

// ---------------------------------------------------------------------------
// POST /auth/signup
// ---------------------------------------------------------------------------
test("POST /auth/signup -> 201, normalise l'email, ne fuit pas le password", async () => {
  const base = uid();
  const mixed = `Sign_${base}@Example.COM`;
  const lower = mixed.toLowerCase();

  const r = await c.req("POST", "/auth/signup", { json: { email: mixed, password: PASSWORD } });
  trackEmail(lower);

  assert.equal(r.status, 201);
  assert.equal(r.data.user.email, lower, "email normalisé en minuscules");
  assert.ok(!("password" in r.data.user), "le password ne doit pas être renvoyé");
  assert.equal(typeof r.data.jwt, "string");
});

test("POST /auth/signup en doublon (casse différente) -> 409", async () => {
  const base = uid();
  const r1 = await c.req("POST", "/auth/signup", { json: { email: `Dup_${base}@Example.com`, password: PASSWORD } });
  trackEmail(`dup_${base}@example.com`);
  assert.equal(r1.status, 201);

  const r2 = await c.req("POST", "/auth/signup", { json: { email: `dup_${base}@example.com`, password: PASSWORD } });
  assert.equal(r2.status, 409);
  assert.equal(r2.data.status, 409);
  assert.equal(typeof r2.data.message, "string");
});

test("POST /auth/signup avec entrées invalides -> 400", async () => {
  const email = await c.req("POST", "/auth/signup", { json: { email: "pas-un-email", password: PASSWORD } });
  assert.equal(email.status, 400);

  const shortPw = await c.req("POST", "/auth/signup", { json: { email: `s_${uid()}@example.com`, password: "court" } });
  assert.equal(shortPw.status, 400);

  // > 72 octets : au-delà bcrypt tronque silencieusement -> rejeté à la création.
  const longPw = await c.req("POST", "/auth/signup", { json: { email: `l_${uid()}@example.com`, password: "a".repeat(73) } });
  assert.equal(longPw.status, 400);
});

// ---------------------------------------------------------------------------
// POST /auth/login
// ---------------------------------------------------------------------------
test("POST /auth/login valide (insensible à la casse) -> 200 + jwt", async () => {
  const { email } = await signup(c.req, "login");
  const r = await c.req("POST", "/auth/login", { json: { email: email.toUpperCase(), password: PASSWORD } });
  assert.equal(r.status, 200);
  assert.equal(typeof r.data.jwt, "string");
});

test("POST /auth/login mauvais mot de passe -> 401 {status,message}", async () => {
  const { email } = await signup(c.req, "login");
  const r = await c.req("POST", "/auth/login", { json: { email, password: "mauvais-mot-de-passe" } });
  assert.equal(r.status, 401);
  assert.equal(r.data.status, 401);
  assert.equal(typeof r.data.message, "string");
});

test("POST /auth/login email inconnu -> 401", async () => {
  const r = await c.req("POST", "/auth/login", { json: { email: `ghost_${uid()}@example.com`, password: PASSWORD } });
  assert.equal(r.status, 401);
});

test("POST /auth/login corps invalide -> 400", async () => {
  const r = await c.req("POST", "/auth/login", { json: { email: "x" } });
  assert.equal(r.status, 400);
});

// ---------------------------------------------------------------------------
// GET /auth/verify
// ---------------------------------------------------------------------------
test("GET /auth/verify avec token valide -> 200 ok", async () => {
  const { token } = await signup(c.req, "verify");
  const r = await c.req("GET", "/auth/verify", { token });
  assert.equal(r.status, 200);
  assert.equal(r.data.message, "ok");
});

test("GET /auth/verify sans token -> 403", async () => {
  const r = await c.req("GET", "/auth/verify");
  assert.equal(r.status, 403);
});

test("GET /auth/verify token invalide -> 403", async () => {
  const r = await c.req("GET", "/auth/verify", { token: "jeton.bidon.invalide" });
  assert.equal(r.status, 403);
});
