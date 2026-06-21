// Augmentation du type `Express.Request` : `user` est posé par le middleware
// `authenticate` (JWT) une fois le Bearer token vérifié.
import 'express';

declare global {
  namespace Express {
    interface Request {
      user?: { id: number };
      // Optionnel : posé uniquement par `validateParams`. Le typer optionnel
      // force les lecteurs à passer par `requireParamId` (garde runtime) plutôt
      // que de supposer à tort que le middleware a toujours tourné.
      safeParams?: Record<string, unknown>;
    }
  }
}

export {};
