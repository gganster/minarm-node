import type { Request } from "express";

// Request dont le corps a été validé et typé par le middleware `validateBody`.
// `B` provient des schemas Zod via `z.infer`.
export type RequestWithBody<B> = Request<Record<string, string>, unknown, B>;
