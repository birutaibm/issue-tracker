import { getCardById, getCardByPath } from '../db/index.js';
import { getCommentsByCardId, CommentWithContent } from '../db/models/comment.js';
import { readCardFile, mountCommentPath, readCommentFile } from '../services/FileSystem.js';
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
    card = await getCardById(cardId);
  } else if (cardPath !== undefined) {
    card = await getCardByPath(cardPath);
  } else {
    throw new Error('Either card_id or card_path is required');
  }

  if (!card) {
    throw new Error('Card not found');
  }

  const content = await readCardFile(card.path);

  // Fetch comments for this card
  const comments = await getCommentsByCardId(card.id);
  const commentsWithContent: CommentWithContent[] = [];
  for (const comment of comments) {
    const commentPath = mountCommentPath(card, comment);
    try {
      const commentContent = await readCommentFile(commentPath);
      commentsWithContent.push({ ...comment, content: commentContent });
    } catch {
      // If comment file doesn't exist, skip it
    }
  }

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({ ...card, content, comments: commentsWithContent }, null, 2),
      },
    ],
  };
}

export default {
  name,
  schema,
  execute,
};
