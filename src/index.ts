import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { promises as fs } from "fs";
import { join, resolve, relative } from "path";

const BASE_DIR = resolve(process.env.HOME || "", "issue-tracker");

async function ensureBaseDir() {
  try {
    await fs.access(BASE_DIR);
  } catch {
    await fs.mkdir(BASE_DIR, { recursive: true });
  }
}

function validatePath(requestedPath: string): string {
  const fullPath = resolve(BASE_DIR, requestedPath);
  const relativePath = relative(BASE_DIR, fullPath);
  
  if (relativePath.startsWith("..") || fullPath.startsWith("..")) {
    throw new Error("Access denied: path traversal not allowed");
  }
  
  return fullPath;
}

async function listFiles(dirPath: string): Promise<string[]> {
  const fullPath = validatePath(dirPath);
  const entries = await fs.readdir(fullPath, { withFileTypes: true });
  
  const results: string[] = [];
  for (const entry of entries) {
    const relPath = relative(BASE_DIR, join(fullPath, entry.name));
    if (entry.isDirectory()) {
      results.push(`${relPath}/`);
    } else {
      results.push(relPath);
    }
  }
  
  return results.sort();
}

async function readMarkdownFile(filePath: string): Promise<string> {
  const fullPath = validatePath(filePath);
  
  if (!filePath.endsWith(".md")) {
    throw new Error("Only .md files can be read");
  }
  
  const content = await fs.readFile(fullPath, "utf-8");
  return content;
}

async function writeMarkdownFile(filePath: string, content: string): Promise<void> {
  const fullPath = validatePath(filePath);
  
  if (!filePath.endsWith(".md")) {
    throw new Error("Only .md files can be created");
  }
  
  const dir = join(fullPath, "..");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(fullPath, content, "utf-8");
}

const server = new Server(
  {
    name: "issue-tracker-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_files",
        description: "List files and directories in the issue-tracker directory",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "Relative path from issue-tracker root (empty for root)",
              default: "",
            },
          },
          required: [],
        },
      },
      {
        name: "read_markdown",
        description: "Read the content of a .md file in the issue-tracker directory",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "Relative path to the .md file from issue-tracker root",
            },
          },
          required: ["path"],
        },
      },
      {
        name: "write_markdown",
        description: "Create or overwrite a .md file in the issue-tracker directory",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "Relative path for the new .md file from issue-tracker root",
            },
            content: {
              type: "string",
              description: "Markdown content to write",
            },
          },
          required: ["path", "content"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    switch (name) {
      case "list_files": {
        const path = (args?.path as string) || "";
        const files = await listFiles(path);
        return {
          content: [
            {
              type: "text",
              text: files.length > 0 ? files.join("\n") : "(empty)",
            },
          ],
        };
      }
      
      case "read_markdown": {
        const path = args?.path as string;
        if (!path) {
          throw new Error("Path is required");
        }
        const content = await readMarkdownFile(path);
        return {
          content: [{ type: "text", text: content }],
        };
      }
      
      case "write_markdown": {
        const path = args?.path as string;
        const content = args?.content as string;
        if (!path || content === undefined) {
          throw new Error("Path and content are required");
        }
        await writeMarkdownFile(path, content);
        return {
          content: [{ type: "text", text: `File created: ${path}` }],
        };
      }
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const files = await listFiles("");
  const mdFiles = files.filter((f) => f.endsWith(".md"));
  
  return {
    resources: mdFiles.map((file) => ({
      uri: `file://${file}`,
      name: file,
      mimeType: "text/markdown",
    })),
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  const filePath = uri.replace("file://", "");
  const content = await readMarkdownFile(filePath);
  
  return {
    contents: [
      {
        uri,
        mimeType: "text/markdown",
        text: content,
      },
    ],
  };
});

async function main() {
  await ensureBaseDir();
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Issue Tracker MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});