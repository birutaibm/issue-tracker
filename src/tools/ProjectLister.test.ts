import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import ProjectLister from '../tools/ProjectLister.js';
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
import type { Project } from '../db/index.js';

describe('ProjectLister Tool', () => {
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

  it('should list all projects', async () => {
    await createTestProject('Project 1');
    await new Promise((resolve) => setTimeout(resolve, 1100));
    await createTestProject('Project 2');
    await new Promise((resolve) => setTimeout(resolve, 1100));
    await createTestProject('Project 3');

    const result = await ProjectLister.execute();
    const content = JSON.parse(result.content[0].text);

    expect(content).toHaveLength(3);
    expect(content.map((p: Project) => p.title)).toEqual(['Project 3', 'Project 2', 'Project 1']);
  });

  it('should return empty array when no projects exist', async () => {
    const result = await ProjectLister.execute();
    const content = JSON.parse(result.content[0].text);

    expect(content).toEqual([]);
  });

  it('should return projects ordered by created_at desc', async () => {
    const project1 = await createTestProject('Project 1');
    await new Promise((resolve) => setTimeout(resolve, 1100));
    const project2 = await createTestProject('Project 2');
    await new Promise((resolve) => setTimeout(resolve, 1100));
    const project3 = await createTestProject('Project 3');

    const result = await ProjectLister.execute();
    const content = JSON.parse(result.content[0].text);

    expect(content).toHaveLength(3);
    expect(content[0].id).toBe(project3.id);
    expect(content[1].id).toBe(project2.id);
    expect(content[2].id).toBe(project1.id);
  }, 10000);
});
