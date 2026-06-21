import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { startClient, signup, teardown, type Client } from "./helpers";
import { UPLOADS_DIR } from "../src/lib/uploads";

let c: Client;
const uploaded: string[] = []; // fichiers écrits sur disque, supprimés en fin de fichier
before(async () => { c = await startClient(); });
after(async () => {
  await Promise.all(
    uploaded.map((f) => fs.promises.unlink(path.join(UPLOADS_DIR, f)).catch(() => undefined))
  );
  await teardown(c.server);
});

function form(bytes: Buffer, type: string, filename: string): FormData {
  const f = new FormData();
  f.append("attachment", new Blob([bytes], { type }), filename);
  return f;
}

const PNG = (): FormData => form(Buffer.from([0x89, 0x50, 0x4e, 0x47]), "image/png", "x.png");

/** Crée un utilisateur + un chien, renvoie {token, id}. */
async function newDog(prefix: string): Promise<{ token: string; id: number }> {
  const { token } = await signup(c.req, prefix);
  const dog = await c.req("POST", "/dogs", { token, json: { name: "Rex", active: true } });
  return { token, id: dog.data.id };
}

// POST /dogs/:id/upload + GET /dogs/upload/:filename
test("upload PNG valide -> 200 (extension dérivée du mimetype) puis servi au propriétaire", async () => {
  const { token, id } = await newDog("up");

  const up = await c.req("POST", `/dogs/${id}/upload`, { token, form: PNG() });
  assert.equal(up.status, 200);
  assert.equal(typeof up.data.attachment, "string");
  assert.ok(up.data.attachment.endsWith(".png"), "extension dérivée du mimetype, pas du nom client");
  uploaded.push(up.data.attachment);

  const served = await c.req("GET", `/dogs/upload/${up.data.attachment}`, { token });
  assert.equal(served.status, 200);
});

test("GET /dogs/upload/:filename par un autre utilisateur -> 404 (ownership)", async () => {
  const { token, id } = await newDog("up");
  const up = await c.req("POST", `/dogs/${id}/upload`, { token, form: PNG() });
  uploaded.push(up.data.attachment);

  const { token: other } = await signup(c.req, "intrus");
  const served = await c.req("GET", `/dogs/upload/${up.data.attachment}`, { token: other });
  assert.equal(served.status, 404);
});

test("GET /dogs/upload avec path-traversal -> 404", async () => {
  const { token } = await newDog("up");
  const r = await c.req("GET", "/dogs/upload/..%2f..%2fpackage.json", { token });
  assert.equal(r.status, 404);
});

test("GET /dogs/upload fichier inexistant -> 404", async () => {
  const { token } = await newDog("up");
  const r = await c.req("GET", "/dogs/upload/inexistant.png", { token });
  assert.equal(r.status, 404);
});

test("upload type non autorisé -> 400", async () => {
  const { token, id } = await newDog("up");
  const r = await c.req("POST", `/dogs/${id}/upload`, { token, form: form(Buffer.from("hello"), "text/plain", "x.txt") });
  assert.equal(r.status, 400);
});

test("upload > 5MB -> 413 {status,message} (erreur multer mappée)", async () => {
  const { token, id } = await newDog("up");
  const r = await c.req("POST", `/dogs/${id}/upload`, { token, form: form(Buffer.alloc(6 * 1024 * 1024, 1), "image/png", "big.png") });
  assert.equal(r.status, 413);
  assert.equal(r.data.status, 413);
  assert.equal(typeof r.data.message, "string");
});

test("upload sans fichier -> 400", async () => {
  const { token, id } = await newDog("up");
  const r = await c.req("POST", `/dogs/${id}/upload`, { token, form: new FormData() });
  assert.equal(r.status, 400);
});

test("upload sur un chien non possédé -> 404", async () => {
  const { id } = await newDog("up");
  const { token: other } = await signup(c.req, "intrus");
  const r = await c.req("POST", `/dogs/${id}/upload`, { token: other, form: PNG() });
  assert.equal(r.status, 404);
});
