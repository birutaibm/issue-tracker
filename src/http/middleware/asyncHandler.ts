import type { NextFunction, Request, RequestHandler, Response } from 'express';

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/**
 * Express 4 does not forward rejected promises returned by async handlers to
 * the error middleware, which can crash the process on unhandled rejections.
 * Wrapping handlers ensures every failure reaches the centralized error handler.
 */
export function asyncHandler(handler: AsyncHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
