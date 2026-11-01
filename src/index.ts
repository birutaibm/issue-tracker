import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { ensureBaseDir } from './services/FileSystem.js';
import { getTool, listTools } from './tools/index.js';
import { createExpressApp } from './http/index.js';

const mcpServer = new McpServer(
  {
    name: 'issue-tracker-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Register tools using the new McpServer API
for (const toolName of listTools()) {
  const tool = getTool(toolName);
  mcpServer.registerTool(tool.name, tool.schema, tool.execute);
}

// Create stateful Streamable HTTP transport (generates session IDs)
const mcpTransport = new StreamableHTTPServerTransport({
  sessionIdGenerator: () => crypto.randomUUID(),
});

async function main() {
  await ensureBaseDir();

  // Connect MCP server to HTTP transport
  await mcpServer.connect(mcpTransport);

  // Create Express app with MCP transport
  const app = createExpressApp(mcpTransport);

  // Start HTTP server (serves both REST API and MCP)
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.error(`HTTP + MCP server running on http://localhost:${PORT}`);
  });
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
