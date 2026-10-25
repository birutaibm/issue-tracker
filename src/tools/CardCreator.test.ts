import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import CardCreator from '../tools/CardCreator.js';
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

describe('CardCreator Tool', () => {
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

  it('should create a new card in existing project', async () => {
    const project = await createTestProject();
    const result = await CardCreator.execute({
      project_id: project.id,
      title: 'Test Card',
      description: 'Card description',
    });

    expect(result).toHaveProperty('content');
    const content = JSON.parse(result.content[0].text);
    expect(content).toMatchObject({
      title: 'Test Card',
      project_id: project.id,
      status: 'todo',
    });
    expect(content.id).toBeDefined();
    expect(content.path).toContain('projects/test-project/cards/');
    expect(content.path).toContain('.md');
  });

  it('should create card file with markdown content', async () => {
    const project = await createTestProject();
    await CardCreator.execute({
      project_id: project.id,
      title: 'Test Card',
      description: 'Card description',
    });

    const knex = await getTestKnex();
    const cards = await knex('cards').where({ project_id: project.id });
    const card = cards[0];

    const fs = await import('fs/promises');
    const cardContent = await fs.readFile(`${TEST_BASE_DIR}/${card.path}`, 'utf-8');
    expect(cardContent).toBe('# Test Card\n\nCard description');
  });

  it('should create card with specified status', async () => {
    const project = await createTestProject();
    const result = await CardCreator.execute({
      project_id: project.id,
      title: 'Test Card',
      description: 'Description',
      status: 'in_progress',
    });

    const content = JSON.parse(result.content[0].text);
    expect(content.status).toBe('in_progress');
  });

  it('should default to todo status', async () => {
    const project = await createTestProject();
    const result = await CardCreator.execute({
      project_id: project.id,
      title: 'Test Card',
      description: 'Description',
    });

    const content = JSON.parse(result.content[0].text);
    expect(content.status).toBe('todo');
  });

  it('should generate unique slug for duplicate card titles', async () => {
    const project = await createTestProject();
    await CardCreator.execute({ project_id: project.id, title: 'Test Card', description: '1' });
    await CardCreator.execute({ project_id: project.id, title: 'Test Card', description: '2' });
    const result = await CardCreator.execute({
      project_id: project.id,
      title: 'Test Card',
      description: '3',
    });

    const content = JSON.parse(result.content[0].text);
    expect(content.path).toContain('test-card-2.md');
  });

  it('should throw error when project_id is missing', async () => {
    await expect(CardCreator.execute({ title: 'Test', description: 'Desc' })).rejects.toThrow(
      'project_id, title, and description are required'
    );
  });

  it('should throw error when title is missing', async () => {
    const project = await createTestProject();
    await expect(
      CardCreator.execute({ project_id: project.id, description: 'Desc' })
    ).rejects.toThrow('project_id, title, and description are required');
  });

  it('should throw error when description is missing', async () => {
    const project = await createTestProject();
    await expect(CardCreator.execute({ project_id: project.id, title: 'Test' })).rejects.toThrow(
      'project_id, title, and description are required'
    );
  });

  it('should throw error for non-existent project', async () => {
    await expect(
      CardCreator.execute({ project_id: 999, title: 'Test', description: 'Desc' })
    ).rejects.toThrow('Project with id 999 not found');
  });

  it('should handle special characters in title', async () => {
    const project = await createTestProject();
    const result = await CardCreator.execute({
      project_id: project.id,
      title: 'Card Tést!@#$',
      description: 'Description',
    });

    const content = JSON.parse(result.content[0].text);
    expect(content.path).toContain('card-test.md');
  });

  it('should return card with timestamps', async () => {
    const project = await createTestProject();
    const result = await CardCreator.execute({
      project_id: project.id,
      title: 'Test Card',
      description: 'Description',
    });

    const content = JSON.parse(result.content[0].text);
    expect(content.created_at).toBeDefined();
    expect(content.updated_at).toBeDefined();
    // Just verify they are valid dates
    expect(new Date(content.created_at).toString()).not.toBe('Invalid Date');
    expect(new Date(content.updated_at).toString()).not.toBe('Invalid Date');
  });
});
