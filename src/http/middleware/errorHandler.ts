import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  console.error('Error:', err);

  if (res.headersSent) {
    return next(err);
  }

  if (err.message.includes('not found')) {
    return res.status(404).json({ error: err.message });
  }

  if (err.message.includes('required')) {
    return res.status(400).json({ error: err.message });
  }

  if (err.message.includes('Access denied')) {
    return res.status(403).json({ error: err.message });
  }

  return res.status(500).json({ error: 'Internal server error' });
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
}
