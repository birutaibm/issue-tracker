import cardReader from './CardReader.js';
import projectCreator from './ProjectCreator.js';
import cardCreator from './CardCreator.js';
import projectLister from './ProjectLister.js';
import cardLister from './CardLister.js';
import commentAdder from './CommentAdder.js';
import { z } from 'zod';

type ZodSchema = z.ZodRawShape | z.ZodObject<z.ZodRawShape>;

interface Tool {
  name: string;
  schema: {
    description: string;
    inputSchema: ZodSchema;
  };
  execute(args: Record<string, unknown> | undefined): Promise<{
    content: Array<{ type: 'text'; text: string }>;
    isError?: boolean;
  }>;
}

const tools: Record<string, Tool> = {
  read_card: cardReader,
  create_project: projectCreator,
  create_card: cardCreator,
  list_projects: projectLister,
  list_cards: cardLister,
  add_comment: commentAdder,
};

export function getTool(name: string): Tool {
  const tool = tools[name];
  if (!tool) {
    return {
      name,
      schema: { description: '', inputSchema: z.object({}) },
      execute() {
        throw new Error(`Unknown tool: ${name}`);
      },
    };
  }

  return tool;
}

export function listTools(): string[] {
  return Object.keys(tools);
}
