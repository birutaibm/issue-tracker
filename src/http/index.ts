import express from 'express';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { requestLogger, errorHandler } from './middleware/errorHandler.js';
import router from './router.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function createExpressApp() {
  const app = express();

  app.use(express.json());
  app.use(requestLogger);

  // API routes
  app.use('/api', router);

  // Static file serving for Vue build
  const clientDist = resolve(__dirname, '../client');
  app.use(express.static(clientDist));

  // SPA fallback - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(join(clientDist, 'index.html'));
    }
  });

  // Error handling
  app.use(errorHandler);

  return app;
}
