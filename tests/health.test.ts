import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import { startClient, teardown, type Client } from "./helpers";

let c: Client;
before(async () => { c = await startClient(); });
after(async () => { await teardown(c.server); });

// GET /health
test("GET /health -> 200 ok (non authentifié, non throttlé)", async () => {
  const r = await c.req("GET", "/health");
  assert.equal(r.status, 200);
  assert.equal(r.data, "ok");
});
