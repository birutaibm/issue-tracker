import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import CardLister from '../tools/CardLister.js';
import {
  getTestKnex,
  setupTestDatabase,
  teardownTestDatabase,
  truncateTestTables,
} from '../__tests__/test-db.js';
import { ensureBaseDir } from '../services/FileSystem.js';
import {
  TEST_BASE_DIR,
  setupTestEnvironment,
  teardownTestEnvironment,
} from '../__tests__/test-utils.js';
import { rm } from 'fs/promises';
import type { Card } from '../db/index.js';

describe('CardLister Tool', () => {
  beforeAll(async () => {
    await setupTestDatabase();
    await setupTestEnvironment();
  });

  afterAll(async () => {
    await teardownTestDatabase();
    await teardownTestEnvironment();
  });

  beforeEach(async () => {
    await truncateTestTables();
    await rm(TEST_BASE_DIR, { recursive: true, force: true }).catch(() => {});
    await ensureBaseDir();
  });

  const createTestProject = async (title = 'Test Project') => {
    const knex = await getTestKnex();
    const [project] = await knex('projects')
      .insert({
        title,
        path: `projects/${title.toLowerCase().replace(/\s+/g, '-')}`,
      })
      .returning('*');
    return project;
  };

  const createTestCard = async (projectId: number, title = 'Test Card') => {
    const knex = await getTestKnex();
    const [card] = await knex('cards')
      .insert({
        title,
        path: `projects/test-project/cards/${title.toLowerCase().replace(/\s+/g, '-')}.md`,
        project_id: projectId,
      })
      .returning('*');
    return card;
  };

  it('should list all cards in a project', async () => {
    const project = await createTestProject();
    await createTestCard(project.id, 'Card 1');
    await new Promise((resolve) => setTimeout(resolve, 1100));
    await createTestCard(project.id, 'Card 2');
    await new Promise((resolve) => setTimeout(resolve, 1100));
    await createTestCard(project.id, 'Card 3');

    const result = await CardLister.execute({ project_id: project.id });
    const content = JSON.parse(result.content[0].text);

    expect(content).toHaveLength(3);
    expect(content.map((c: Card) => c.title)).toEqual(['Card 3', 'Card 2', 'Card 1']);
  }, 10000);

  it('should return empty array for project with no cards', async () => {
    const project = await createTestProject();

    const result = await CardLister.execute({ project_id: project.id });
    const content = JSON.parse(result.content[0].text);

    expect(content).toEqual([]);
  });

  it('should return cards ordered by created_at desc', async () => {
    const project = await createTestProject();
    const card1 = await createTestCard(project.id, 'Card 1');
    await new Promise((resolve) => setTimeout(resolve, 1100));
    const card2 = await createTestCard(project.id, 'Card 2');
    await new Promise((resolve) => setTimeout(resolve, 1100));
    const card3 = await createTestCard(project.id, 'Card 3');

    const result = await CardLister.execute({ project_id: project.id });
    const content = JSON.parse(result.content[0].text);

    expect(content).toHaveLength(3);
    expect(content[0].id).toBe(card3.id);
    expect(content[1].id).toBe(card2.id);
    expect(content[2].id).toBe(card1.id);
  }, 10000);

  it('should throw error when project_id is missing', async () => {
    await expect(CardLister.execute({})).rejects.toThrow('project_id is required');
  });

  it('should throw error for non-existent project', async () => {
    await expect(CardLister.execute({ project_id: 999 })).rejects.toThrow(
      'Project with id 999 not found'
    );
  });

  it('should only return cards for the specified project', async () => {
    const project1 = await createTestProject('Project 1');
    const project2 = await createTestProject('Project 2');

    await createTestCard(project1.id, 'Card 1');
    await createTestCard(project1.id, 'Card 2');
    await createTestCard(project2.id, 'Card 3');

    const result1 = await CardLister.execute({ project_id: project1.id });
    const content1 = JSON.parse(result1.content[0].text);

    const result2 = await CardLister.execute({ project_id: project2.id });
    const content2 = JSON.parse(result2.content[0].text);

    expect(content1).toHaveLength(2);
    expect(content2).toHaveLength(1);
    expect(content2[0].project_id).toBe(project2.id);
  });
});
