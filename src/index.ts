import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ensureBaseDir } from './services/FileSystem.js';
import { getTool, listTools } from './tools/index.js';

const server = new McpServer(
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
  server.registerTool(tool.name, tool.schema, tool.execute);
}

async function main() {
  await ensureBaseDir();

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Issue Tracker MCP server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
