import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import ProjectCreator from '../tools/ProjectCreator.js';
import {
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

describe('ProjectCreator Tool', () => {
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

  it('should create a new project with slug from title', async () => {
    const result = await ProjectCreator.execute({ title: 'My Test Project' });

    expect(result).toHaveProperty('content');
    const content = JSON.parse(result.content[0].text);
    expect(content).toMatchObject({
      title: 'My Test Project',
      path: 'projects/my-test-project',
    });
    expect(content.id).toBeDefined();
  });

  it('should create project directories', async () => {
    await ProjectCreator.execute({ title: 'My Test Project' });

    const projectDir = `${TEST_BASE_DIR}/projects/my-test-project`;
    const cardsDir = `${projectDir}/cards`;

    await expect(import('fs/promises').then((fs) => fs.access(projectDir))).resolves.not.toThrow();
    await expect(import('fs/promises').then((fs) => fs.access(cardsDir))).resolves.not.toThrow();
  });

  it('should handle special characters in title', async () => {
    const result = await ProjectCreator.execute({ title: 'Projeto Tést!@#$' });

    const content = JSON.parse(result.content[0].text);
    expect(content.path).toBe('projects/projeto-test');
  });

  it('should generate unique slug for duplicate titles', async () => {
    await ProjectCreator.execute({ title: 'Test Project' });
    const result = await ProjectCreator.execute({ title: 'Test Project' });

    const content = JSON.parse(result.content[0].text);
    expect(content.path).toBe('projects/test-project-1');
  });

  it('should throw error when title is missing', async () => {
    await expect(ProjectCreator.execute({})).rejects.toThrow('Title is required');
  });

  it('should throw error when title is empty string', async () => {
    await expect(ProjectCreator.execute({ title: '' })).rejects.toThrow('Title is required');
  });

  it('should handle multiple projects with similar names', async () => {
    await ProjectCreator.execute({ title: 'Project' });
    await ProjectCreator.execute({ title: 'Project' });
    const result = await ProjectCreator.execute({ title: 'Project' });

    const content = JSON.parse(result.content[0].text);
    expect(content.path).toBe('projects/project-2');
  });

  it('should return project with timestamps', async () => {
    const result = await ProjectCreator.execute({ title: 'Test Project' });

    const content = JSON.parse(result.content[0].text);
    expect(content.created_at).toBeDefined();
    expect(content.updated_at).toBeDefined();
    // Just verify they are valid dates
    expect(new Date(content.created_at).toString()).not.toBe('Invalid Date');
    expect(new Date(content.updated_at).toString()).not.toBe('Invalid Date');
  });
});
