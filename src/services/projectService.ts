import { getKnex } from '../db/client.js';
import type { Project, UpdateProjectInput } from '../shared/types.js';

interface ProjectWithCards extends Project {
  cards: { id: number; title: string; status: 'todo' | 'in_progress' | 'done' }[];
  cardCounts: { todo: number; in_progress: number; done: number };
}

export async function listProjects(): Promise<Project[]> {
  const knex = getKnex();
  const projects = await knex('projects').orderBy('created_at', 'desc');

  // Get card counts for each project
  for (const project of projects) {
    const cards = await knex('cards').where({ project_id: project.id });
    project.cardCounts = cards.reduce(
      (acc, card) => {
        acc[card.status]++;
        return acc;
      },
      { todo: 0, in_progress: 0, done: 0 }
    );
  }

  return projects;
}

export async function createProject(title: string): Promise<Project> {
  const { generateSlug, ensureUniqueSlug, ensureProjectDirs, mountProjectPath } =
    await import('../services/FileSystem.js');

  const baseSlug = generateSlug(title);
  const projectSlug = await ensureUniqueSlug(baseSlug, async (slug) => {
    const existing = await getProjectByPath(mountProjectPath(slug));
    return !!existing;
  });

  const projectPath = await ensureProjectDirs(projectSlug);

  const knex = getKnex();
  const [project] = await knex.transaction(async (trx) => {
    const [p] = await trx('projects').insert({ title, path: projectPath }).returning('*');
    return [p];
  });

  return project;
}

export async function getProjectById(id: number): Promise<Project | null> {
  const knex = getKnex();
  const project = await knex('projects').where({ id }).first();
  return project || null;
}

export async function getProjectWithCards(id: number): Promise<ProjectWithCards | null> {
  const knex = getKnex();
  const project = await knex('projects').where({ id }).first();
  if (!project) return null;

  const cards = await knex('cards').where({ project_id: id }).orderBy('created_at', 'desc');

  const cardCounts = cards.reduce(
    (acc, card) => {
      acc[card.status]++;
      return acc;
    },
    { todo: 0, in_progress: 0, done: 0 }
  );

  return {
    ...project,
    cards: cards.map((c) => ({ id: c.id, title: c.title, status: c.status })),
    cardCounts,
  };
}

export async function getProjectByPath(path: string): Promise<Project | null> {
  const knex = getKnex();
  const project = await knex('projects').where({ path }).first();
  return project || null;
}

export async function updateProject(
  id: number,
  input: UpdateProjectInput
): Promise<Project | null> {
  const knex = getKnex();
  if (Object.keys(input).length === 0) {
    return getProjectById(id);
  }
  const [project] = await knex('projects').where({ id }).update(input).returning('*');
  return project || null;
}

export async function deleteProject(id: number): Promise<boolean> {
  const knex = getKnex();
  const project = await knex('projects').where({ id }).first();
  if (!project) return false;

  const cardIds = (await knex('cards').where({ project_id: id }).pluck('id')) as number[];

  await knex.transaction(async (trx) => {
    if (cardIds.length > 0) {
      await trx('comments').whereIn('card_id', cardIds).delete();
    }
    await trx('cards').where({ project_id: id }).delete();
    await trx('projects').where({ id }).delete();
  });

  const { removeProjectFiles } = await import('../services/FileSystem.js');
  await removeProjectFiles(project.path);

  return true;
}
