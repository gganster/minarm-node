// Augmentation du type `Express.Request` : `user` est posé par le middleware
// `authenticate` (JWT) une fois le Bearer token vérifié.
import 'express';

declare global {
  namespace Express {
    interface Request {
      user?: { id: number };
      safeParams: Record<string, unknown>;
    }
  }
}

export {};
