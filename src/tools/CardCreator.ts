import { createCard, updateCard } from '../services/cardService.js';
import { z } from 'zod';

const name = 'create_card';

const schema = {
  description: 'Create a new card in an existing project',
  inputSchema: {
    project_id: z.number().describe('ID of the project'),
    title: z.string().describe('Title of the card'),
    description: z.string().describe('Markdown description of the card'),
    status: z.enum(['todo', 'in_progress', 'done']).default('todo').describe('Initial status'),
  },
};

async function execute(args: Record<string, unknown> | undefined) {
  const projectId = args?.project_id as number;
  const title = args?.title as string;
  const description = args?.description as string;
  const status = (args?.status as 'todo' | 'in_progress' | 'done') || 'todo';

  if (!projectId || !title || !description) {
    throw new Error('project_id, title, and description are required');
  }

  const card = await createCard(projectId, title, description);

  if (status !== 'todo') {
    const updated = await updateCard(card.id, { status });
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(updated, null, 2) }],
    };
  }

  return {
    content: [{ type: 'text' as const, text: JSON.stringify(card, null, 2) }],
  };
}

export default {
  name,
  schema,
  execute,
};
