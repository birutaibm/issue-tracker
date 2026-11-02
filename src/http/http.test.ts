import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import type { Server } from 'http';
import type { AddressInfo } from 'net';
import type { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createExpressApp } from './index.js';
import { setupTestEnvironment, teardownTestEnvironment } from '../__tests__/test-utils.js';
import {
  setupTestDatabase,
  teardownTestDatabase,
  truncateTestTables,
} from '../__tests__/test-db.js';

describe('HTTP error handling', () => {
  let server: Server | undefined;
  let baseUrl: string;

  beforeAll(async () => {
    await setupTestEnvironment();
    await setupTestDatabase();

    const transport = {} as unknown as StreamableHTTPServerTransport;
    const app = createExpressApp(transport);

    server = app.listen(0);
    await new Promise<void>((resolve) => {
      server?.once('listening', resolve);
    });

    const address = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  beforeEach(async () => {
    await truncateTestTables();
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server?.close((error) => (error ? reject(error) : resolve()));
      });
    }
    await teardownTestDatabase();
    await teardownTestEnvironment();
  });

  it('returns 404 without crashing when a project does not exist', async () => {
    const response = await fetch(`${baseUrl}/api/projects/999/cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Card', description: 'Description' }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: 'Project with id 999 not found',
    });

    // The process must remain alive and able to serve subsequent requests.
    const health = await fetch(`${baseUrl}/mcp/health`);
    expect(health.status).toBe(200);
  });

  it('returns 404 without crashing when a card does not exist', async () => {
    const response = await fetch(`${baseUrl}/api/cards/999/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Comment' }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: 'Card with id 999 not found',
    });

    const health = await fetch(`${baseUrl}/mcp/health`);
    expect(health.status).toBe(200);
  });
});
