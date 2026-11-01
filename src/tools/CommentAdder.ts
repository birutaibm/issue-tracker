import { getCardById } from '../services/cardService.js';
import { createComment } from '../services/commentService.js';
import { z } from 'zod';

const name = 'add_comment';

const schema = {
  description: 'Add a comment to a card',
  inputSchema: {
    card_id: z.number().describe('ID of the card'),
    content: z.string().describe('Markdown content of the comment'),
  },
};

async function execute(args: Record<string, unknown> | undefined) {
  const cardId = args?.card_id as number;
  const content = args?.content as string;

  if (!cardId || !content) {
    throw new Error('card_id and content are required');
  }

  const card = await getCardById(cardId);
  if (!card) {
    throw new Error(`Card with id ${cardId} not found`);
  }

  const comment = await createComment(cardId, content);

  return {
    content: [{ type: 'text' as const, text: JSON.stringify({ ...comment, content }, null, 2) }],
  };
}

export default {
  name,
  schema,
  execute,
};
