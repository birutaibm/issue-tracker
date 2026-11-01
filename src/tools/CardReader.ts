import { getCardByPath, getCardWithContent } from '../services/cardService.js';
import { z } from 'zod';

const name = 'read_card';

const schema = {
  description: 'Get card data from the database together with its content from the markdown file',
  inputSchema: {
    card_id: z.number().optional().describe('ID of the card'),
    card_path: z
      .string()
      .optional()
      .describe("Relative path to the card's markdown file from issue-tracker root"),
  },
};

async function execute(args: Record<string, unknown> | undefined) {
  const cardId = args?.card_id as number | undefined;
  const cardPath = args?.card_path as string | undefined;

  let card;
  if (cardId !== undefined) {
    card = await getCardWithContent(cardId);
  } else if (cardPath !== undefined) {
    card = await getCardByPath(cardPath);
    if (card) {
      card = await getCardWithContent(card.id);
    }
  } else {
    throw new Error('Either card_id or card_path is required');
  }

  if (!card) {
    throw new Error('Card not found');
  }

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(card, null, 2),
      },
    ],
  };
}

export default {
  name,
  schema,
  execute,
};
