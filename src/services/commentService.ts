import { getKnex } from '../db/client.js';
import { readCommentFile, writeCommentFile, mountCommentPath } from './FileSystem.js';
import type { Card as DbCard } from '../db/models/card.js';
import type { CommentWithContent } from '../shared/types.js';

export async function listComments(cardId: number): Promise<CommentWithContent[]> {
  const knex = getKnex();
  const comments = await knex('comments').where({ card_id: cardId }).orderBy('created_at', 'asc');

  // Get card to build comment paths
  const card = (await knex('cards').where({ id: cardId }).first()) as DbCard | undefined;
  if (!card) return comments as CommentWithContent[];

  const commentsWithContent: CommentWithContent[] = [];
  for (const comment of comments) {
    const commentPath = mountCommentPath(card, comment);
    try {
      const content = await readCommentFile(commentPath);
      commentsWithContent.push({ ...comment, content });
    } catch {
      // If comment file doesn't exist, skip it
    }
  }

  return commentsWithContent;
}

export async function createComment(cardId: number, content: string): Promise<CommentWithContent> {
  const knex = getKnex();

  // Verify card exists directly in DB instead of importing cardService (avoids circular dependency)
  const card = (await knex('cards').where({ id: cardId }).first()) as DbCard | undefined;
  if (!card) {
    throw new Error(`Card with id ${cardId} not found`);
  }

  const comment = await knex.transaction(async (trx) => {
    const [c] = await trx('comments').insert({ card_id: cardId }).returning('*');
    return c;
  });

  await writeCommentFile(card.path, comment.id, content);

  return { ...comment, content };
}
