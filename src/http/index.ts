import express from 'express';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { requestLogger, errorHandler } from './middleware/errorHandler.js';
import router from './router.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SESSION_COOKIE_NAME = 'mcp-session-id';

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  return cookieHeader.split(';').reduce(
    (acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      if (key && value) acc[key] = value;
      return acc;
    },
    {} as Record<string, string>
  );
}

export function createExpressApp(mcpTransport: StreamableHTTPServerTransport) {
  const app = express();

  app.use(express.json());
  app.use(requestLogger);

  // Add error handler to transport
  mcpTransport.onerror = (error: Error) => {
    console.error('[MCP] Transport error:', error);
    console.error('[MCP] Transport error stack:', error.stack);
  };

  // MCP endpoint - stateless Streamable HTTP transport with session cookie support
  app.post('/mcp', (req, res) => {
    console.error('[MCP] POST /mcp request received', {
      headers: req.headers,
      body: req.body,
    });

    // Extract session ID from cookie if not in header
    const cookies = parseCookies(req.headers.cookie);
    if (!req.headers['mcp-session-id'] && cookies[SESSION_COOKIE_NAME]) {
      // Set on both Express req.headers and raw IncomingMessage
      req.headers['mcp-session-id'] = cookies[SESSION_COOKIE_NAME];
      (req as { rawHeaders?: string[] }).rawHeaders?.push(
        'mcp-session-id',
        cookies[SESSION_COOKIE_NAME]
      );
      console.error('[MCP] Using session ID from cookie:', cookies[SESSION_COOKIE_NAME]);
    }

    try {
      // Capture session ID from response headers via setHeader
      const originalSetHeader = res.setHeader.bind(res);
      res.setHeader = (name: string, value: string | number | readonly string[]) => {
        if (name.toLowerCase() === 'mcp-session-id') {
          const sessionId = Array.isArray(value) ? value[0] : value;
          res.setHeader(
            'Set-Cookie',
            `${SESSION_COOKIE_NAME}=${sessionId}; Path=/mcp; HttpOnly; SameSite=Lax`
          );
          console.error('[MCP] Set session cookie:', sessionId);
        }
        return originalSetHeader(name, value);
      };

      mcpTransport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error('[MCP] POST /mcp handler error:', error);
      console.error(
        '[MCP] POST /mcp handler error stack:',
        error instanceof Error ? error.stack : 'no stack'
      );
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  app.get('/mcp', (req, res) => {
    console.error('[MCP] GET /mcp request received', {
      headers: req.headers,
    });

    // Also support session ID from cookie for GET (SSE)
    const cookies = parseCookies(req.headers.cookie);
    if (!req.headers['mcp-session-id'] && cookies[SESSION_COOKIE_NAME]) {
      req.headers['mcp-session-id'] = cookies[SESSION_COOKIE_NAME];
      (req as { rawHeaders?: string[] }).rawHeaders?.push(
        'mcp-session-id',
        cookies[SESSION_COOKIE_NAME]
      );
      console.error('[MCP] Using session ID from cookie for GET:', cookies[SESSION_COOKIE_NAME]);
    }

    try {
      mcpTransport.handleRequest(req, res);
    } catch (error) {
      console.error('[MCP] GET /mcp handler error:', error);
      console.error(
        '[MCP] GET /mcp handler error stack:',
        error instanceof Error ? error.stack : 'no stack'
      );
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // MCP health check
  app.get('/mcp/health', (_req, res) => {
    res.json({ status: 'ok', transport: 'streamable-http', mode: 'stateful' });
  });

  // API routes
  app.use('/api', router);

  // Static file serving for Vue build
  const clientDist = resolve(__dirname, '../client');
  app.use(express.static(clientDist));

  // SPA fallback - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/mcp')) {
      res.sendFile(join(clientDist, 'index.html'));
    }
  });

  // Error handling
  app.use(errorHandler);

  return app;
}
