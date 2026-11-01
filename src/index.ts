import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
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

async function main() {
  await ensureBaseDir();

  // Start MCP server (stdio)
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
  console.error('Issue Tracker MCP server running on stdio');

  // Start Express server (HTTP)
  const app = createExpressApp();
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.error(`HTTP server running on http://localhost:${PORT}`);
  });
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
