import type { Request, Response, NextFunction } from 'express';

export const logguer = (req: Request, res: Response, next: NextFunction) => {
  console.log(req);
  next();
}