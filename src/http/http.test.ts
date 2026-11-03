import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { createExpressApp } from './index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import http, { type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';

function makeTransport(sessionId: string | undefined) {
  const handleRequest = jest.fn(
    async (_req: unknown, _res: ServerResponse, _parsedBody?: unknown) => {
      // No-op: this should NOT be invoked for a re-initialization request.
    }
  );
  const transport = {
    sessionId,
    handleRequest,
    onerror: undefined as unknown as ((error: Error) => void) | undefined,
  } as unknown as StreamableHTTPServerTransport;
  return { transport, handleRequest };
}

describe('MCP re-initialization', () => {
  let server: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
    const { transport } = makeTransport('existing-session-id');
    const app = createExpressApp(transport);
    server = app.listen(0);
    await new Promise<void>((resolve) => {
      server.once('listening', () => resolve());
    });
    const address = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });

  it('returns 200 and resumes the existing session instead of "Server already initialized"', async () => {
    const response = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 0,
        method: 'initialize',
        params: {
          protocolVersion: '2025-11-25',
          capabilities: {},
          clientInfo: { name: 'test', version: '1.0.0' },
        },
      }),
    });

    expect(response.status).toBe(200);

    const body = (await response.json()) as Record<string, unknown>;
    expect(body).toMatchObject({
      jsonrpc: '2.0',
      id: 0,
      result: {
        protocolVersion: '2025-11-25',
        capabilities: { tools: {}, resources: {} },
        serverInfo: { name: 'issue-tracker-mcp', version: '1.0.0' },
      },
    });

    // Session cookie must be set so the client can resume the session.
    const setCookie = response.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain('mcp-session-id=existing-session-id');
    expect(setCookie).toContain('Path=/mcp');
  });
});
