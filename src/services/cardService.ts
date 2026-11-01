import { getKnex } from '../db/client.js';
import type { Card, UpdateCardInput } from '../shared/types.js';
import type { Card as DbCard } from '../db/models/card.js';

interface CardWithContent extends Card {
  content: string;
  comments: {
    id: number;
    card_id: number;
    content: string;
    created_at: string;
    updated_at: string;
  }[];
  project_slug?: string;
  slug?: string;
}

export async function listCards(projectId: number): Promise<Card[]> {
  const knex = getKnex();
  return knex('cards').where({ project_id: projectId }).orderBy('created_at', 'desc');
}

export async function createCard(
  projectId: number,
  title: string,
  description: string
): Promise<Card> {
  const { generateSlug, ensureUniqueSlug, writeCardFile, mountCardPath } =
    await import('../services/FileSystem.js');
  const { getProjectById } = await import('./projectService.js');

  const project = await getProjectById(projectId);
  if (!project) {
    throw new Error(`Project with id ${projectId} not found`);
  }

  const baseSlug = generateSlug(title);
  const cardSlug = await ensureUniqueSlug(baseSlug, async (slug) => {
    const existing = await getCardByPath(mountCardPath(project, slug));
    return !!existing;
  });

  const cardPath = mountCardPath(project, cardSlug);
  const cardContent = `# ${title}\n\n${description}`;

  const knex = getKnex();
  const [card] = await knex.transaction(async (trx) => {
    await writeCardFile(cardPath, cardContent);

    const [c] = await trx('cards')
      .insert({
        title,
        path: cardPath,
        status: 'todo',
        project_id: projectId,
      })
      .returning('*');
    return [c];
  });

  return card;
}

export async function getCardById(id: number): Promise<DbCard | null> {
  const knex = getKnex();
  const card = await knex('cards').where({ id }).first();
  return card || null;
}

export async function getCardByPath(path: string): Promise<DbCard | null> {
  const knex = getKnex();
  const card = await knex('cards').where({ path }).first();
  return card || null;
}

export async function getCardWithContent(id: number): Promise<CardWithContent | null> {
  const knex = getKnex();
  const card = await knex('cards').where({ id }).first();
  if (!card) return null;

  const { readCardFile, mountCommentPath, readCommentFile } =
    await import('../services/FileSystem.js');
  const { listComments } = await import('./commentService.js');

  const content = await readCardFile(card.path);

  const comments = await listComments(card.id);
  const commentsWithContent = [];
  for (const comment of comments) {
    const commentPath = mountCommentPath(card, comment);
    try {
      const commentContent = await readCommentFile(commentPath);
      commentsWithContent.push({ ...comment, content: commentContent });
    } catch {
      // If comment file doesn't exist, skip it
    }
  }

  // Extract slugs for asset serving
  const pathParts = card.path.split('/');
  const projectSlug = pathParts[1]; // projects/{projectSlug}/cards/{cardSlug}.md
  const cardSlug = pathParts[3]?.replace('.md', '');

  return {
    ...card,
    content,
    comments: commentsWithContent,
    project_slug: projectSlug,
    slug: cardSlug,
  };
}

export async function updateCard(id: number, input: UpdateCardInput): Promise<DbCard | null> {
  const knex = getKnex();
  if (Object.keys(input).length === 0) {
    return getCardById(id);
  }
  const [card] = await knex('cards').where({ id }).update(input).returning('*');
  return card || null;
}

export async function deleteCard(id: number): Promise<boolean> {
  const knex = getKnex();
  const card = await knex('cards').where({ id }).first();
  if (!card) return false;

  await knex.transaction(async (trx) => {
    await trx('comments').where({ card_id: id }).delete();
    await trx('cards').where({ id }).delete();
  });

  const { removeCardFiles } = await import('../services/FileSystem.js');
  await removeCardFiles(card.path);

  return true;
}
