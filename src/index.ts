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
import { createProject, getProjectById, getProjectByPath, listProjects } from "./db/models/project.js";
import { createCard, getCardById, getCardByPath, listCards, CardStatus } from "./db/models/card.js";
import { createComment, getCommentsByCardId, CreateCommentInput, CommentWithContent } from "./db/models/comment.js";
import { getKnex } from "./db/client.js";

const BASE_DIR = resolve(process.env.HOME || "", "issue-tracker");

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function ensureUniqueSlug(baseSlug: string, checkFn: (slug: string) => Promise<boolean>): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  while (await checkFn(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
}

async function ensureBaseDir() {
  try {
    await fs.access(BASE_DIR);
  } catch {
    await fs.mkdir(BASE_DIR, { recursive: true });
  }
}

async function ensureProjectDirs(projectSlug: string): Promise<string> {
  const projectPath = join("projects", projectSlug);
  const fullPath = resolve(BASE_DIR, projectPath);
  await fs.mkdir(fullPath, { recursive: true });
  await fs.mkdir(join(fullPath, "cards"), { recursive: true });
  return projectPath;
}

function validatePath(requestedPath: string): string {
  const fullPath = resolve(BASE_DIR, requestedPath);
  const relativePath = relative(BASE_DIR, fullPath);
  
  if (relativePath.startsWith("..") || fullPath.startsWith("..")) {
    throw new Error("Access denied: path traversal not allowed");
  }
  
  return fullPath;
}

async function readCardFile(cardPath: string): Promise<string> {
  const fullPath = validatePath(cardPath);
  const content = await fs.readFile(fullPath, "utf-8");
  return content;
}

function getCommentsDir(cardPath: string): string {
  return cardPath.replace(/\.md$/, "") + "/comments";
}

async function ensureCommentsDir(cardPath: string): Promise<string> {
  const commentsDir = getCommentsDir(cardPath);
  const fullPath = resolve(BASE_DIR, commentsDir);
  await fs.mkdir(fullPath, { recursive: true });
  return commentsDir;
}

async function writeCommentFile(commentPath: string, content: string): Promise<void> {
  const fullPath = validatePath(commentPath);
  await fs.writeFile(fullPath, content, "utf-8");
}

async function readCommentFile(commentPath: string): Promise<string> {
  const fullPath = validatePath(commentPath);
  const content = await fs.readFile(fullPath, "utf-8");
  return content;
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
        name: "read_card",
        description: "Get card data from the database together with its content from the markdown file",
        inputSchema: {
          type: "object",
          properties: {
            card_id: {
              type: "integer",
              description: "ID of the card",
            },
            card_path: {
              type: "string",
              description: "Relative path to the card's markdown file from issue-tracker root",
            },
          },
          required: [],
        },
      },
      {
        name: "create_project",
        description: "Create a new project in the issue tracker",
        inputSchema: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "Title of the project",
            },
          },
          required: ["title"],
        },
      },
      {
        name: "create_card",
        description: "Create a new card in an existing project",
        inputSchema: {
          type: "object",
          properties: {
            project_id: {
              type: "integer",
              description: "ID of the project",
            },
            title: {
              type: "string",
              description: "Title of the card",
            },
            description: {
              type: "string",
              description: "Markdown description of the card",
            },
            status: {
              type: "string",
              description: "Initial status (todo, in_progress, done)",
              enum: ["todo", "in_progress", "done"],
              default: "todo",
            },
          },
          required: ["project_id", "title", "description"],
        },
      },
      {
        name: "list_projects",
        description: "List all projects in the issue tracker",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "list_cards",
        description: "List all cards in a specific project",
        inputSchema: {
          type: "object",
          properties: {
            project_id: {
              type: "integer",
              description: "ID of the project",
            },
          },
          required: ["project_id"],
        },
      },
      {
        name: "add_comment",
        description: "Add a comment to a card",
        inputSchema: {
          type: "object",
          properties: {
            card_id: {
              type: "integer",
              description: "ID of the card",
            },
            content: {
              type: "string",
              description: "Markdown content of the comment",
            },
          },
          required: ["card_id", "content"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    switch (name) {
      case "read_card": {
        const cardId = args?.card_id as number | undefined;
        const cardPath = args?.card_path as string | undefined;
        
        let card;
        if (cardId !== undefined) {
          card = await getCardById(cardId);
        } else if (cardPath !== undefined) {
          card = await getCardByPath(cardPath);
        } else {
          throw new Error("Either card_id or card_path is required");
        }
        
        if (!card) {
          throw new Error("Card not found");
        }
        
        const content = await readCardFile(card.path);
        
        // Fetch comments for this card
        const comments = await getCommentsByCardId(card.id);
        const commentsWithContent: CommentWithContent[] = [];
        for (const comment of comments) {
          const commentPath = join(getCommentsDir(card.path), `${comment.id}.md`);
          try {
            const commentContent = await readCommentFile(commentPath);
            commentsWithContent.push({ ...comment, content: commentContent });
          } catch {
            // If comment file doesn't exist, skip it
          }
        }
        
        return {
          content: [{ type: "text", text: JSON.stringify({ ...card, content, comments: commentsWithContent }, null, 2) }],
        };
      }
      
      case "create_project": {
        const title = args?.title as string;
        if (!title) {
          throw new Error("Title is required");
        }
        
        const baseSlug = generateSlug(title);
        const projectSlug = await ensureUniqueSlug(baseSlug, async (slug) => {
          const existing = await getProjectByPath(join("projects", slug));
          return !!existing;
        });
        
        const projectPath = await ensureProjectDirs(projectSlug);
        
        const knex = getKnex();
        const [project] = await knex.transaction(async (trx) => {
          const [p] = await trx("projects").insert({
            title,
            path: projectPath,
          }).returning("*");
          return [p];
        });
        
        return {
          content: [{ type: "text", text: JSON.stringify(project, null, 2) }],
        };
      }
      
      case "create_card": {
        const projectId = args?.project_id as number;
        const title = args?.title as string;
        const description = args?.description as string;
        const status = (args?.status as CardStatus) || "todo";
        
        if (!projectId || !title || !description) {
          throw new Error("project_id, title, and description are required");
        }
        
        const project = await getProjectById(projectId);
        if (!project) {
          throw new Error(`Project with id ${projectId} not found`);
        }
        
        const baseSlug = generateSlug(title);
        const cardSlug = await ensureUniqueSlug(baseSlug, async (slug) => {
          const existing = await getCardByPath(join(project.path, "cards", `${slug}.md`));
          return !!existing;
        });
        
        const cardPath = join(project.path, "cards", `${cardSlug}.md`);
        const fullCardPath = resolve(BASE_DIR, cardPath);
        
        const cardContent = `# ${title}\n\n${description}`;
        
        const knex = getKnex();
        const [card] = await knex.transaction(async (trx) => {
          await fs.mkdir(join(fullCardPath, ".."), { recursive: true });
          await fs.writeFile(fullCardPath, cardContent, "utf-8");
          
          const [c] = await trx("cards").insert({
            title,
            path: cardPath,
            status,
            project_id: projectId,
          }).returning("*");
          return [c];
        });
        
        return {
          content: [{ type: "text", text: JSON.stringify(card, null, 2) }],
        };
      }
      
      case "list_projects": {
        const projects = await listProjects();
        return {
          content: [{ type: "text", text: JSON.stringify(projects, null, 2) }],
        };
      }
      
      case "list_cards": {
        const projectId = args?.project_id as number;
        if (!projectId) {
          throw new Error("project_id is required");
        }
        
        const project = await getProjectById(projectId);
        if (!project) {
          throw new Error(`Project with id ${projectId} not found`);
        }
        
        const cards = await listCards(projectId);
        return {
          content: [{ type: "text", text: JSON.stringify(cards, null, 2) }],
        };
      }
      
      case "add_comment": {
        const cardId = args?.card_id as number;
        const content = args?.content as string;
        
        if (!cardId || !content) {
          throw new Error("card_id and content are required");
        }
        
        const card = await getCardById(cardId);
        if (!card) {
          throw new Error(`Card with id ${cardId} not found`);
        }
        
        const knex = getKnex();
        const comment = await knex.transaction(async (trx) => {
          const [c] = await trx("comments").insert({ card_id: cardId }).returning("*");
          return c;
        });
        
        const commentsDir = await ensureCommentsDir(card.path);
        const commentPath = join(commentsDir, `${comment.id}.md`);
        const fullCommentPath = resolve(BASE_DIR, commentPath);
        
        await fs.writeFile(fullCommentPath, content, "utf-8");
        
        return {
          content: [{ type: "text", text: JSON.stringify({ ...comment, content }, null, 2) }],
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
  const knex = getKnex();
  const cards = await knex("cards").select("path");
  
  return {
    resources: cards.map((card) => ({
      uri: `file://${card.path}`,
      name: card.path,
      mimeType: "text/markdown",
    })),
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  const filePath = uri.replace("file://", "");
  const content = await readCardFile(filePath);
  
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