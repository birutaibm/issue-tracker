import { describe, it, expect, beforeEach, afterAll, beforeAll } from '@jest/globals';
import {
  listProjects,
  createProject,
  getProjectById,
  getProjectWithCards,
  updateProject,
  deleteProject,
} from '../services/projectService.js';
import { createCard } from '../services/cardService.js';
import { createComment } from '../services/commentService.js';
import {
  TEST_BASE_DIR,
  setupTestEnvironment,
  teardownTestEnvironment,
} from '../__tests__/test-utils.js';
import {
  setupTestDatabase,
  teardownTestDatabase,
  truncateTestTables,
} from '../__tests__/test-db.js';
import { resolve } from 'path';
import { access } from 'fs/promises';

describe('Project Service', () => {
  beforeAll(async () => {
    await setupTestEnvironment();
    await setupTestDatabase();
    await truncateTestTables();
  });

  beforeEach(async () => {
    await truncateTestTables();
  });

  afterAll(async () => {
    await teardownTestDatabase();
    await teardownTestEnvironment();
  });

  describe('listProjects', () => {
    it('should return empty array when no projects exist', async () => {
      const projects = await listProjects();
      expect(projects).toEqual([]);
    });

    it('should return projects ordered by created_at desc', async () => {
      await createProject('First Project');
      await new Promise((r) => setTimeout(r, 1100));
      await createProject('Second Project');
      await new Promise((r) => setTimeout(r, 1100));
      await createProject('Third Project');

      const projects = await listProjects();
      expect(projects).toHaveLength(3);
      expect(projects[0].title).toBe('Third Project');
      expect(projects[1].title).toBe('Second Project');
      expect(projects[2].title).toBe('First Project');
    });
  });

  describe('createProject', () => {
    it('should create a new project', async () => {
      const project = await createProject('Test Project');
      expect(project).toMatchObject({
        title: 'Test Project',
        path: 'projects/test-project',
      });
      expect(project.id).toBeDefined();
      expect(project.created_at).toBeDefined();
      expect(project.updated_at).toBeDefined();
    });

    it('should generate unique slugs for duplicate titles', async () => {
      await createProject('Test Project');
      const project2 = await createProject('Test Project');
      const project3 = await createProject('Test Project');

      expect(project2.path).toBe('projects/test-project-1');
      expect(project3.path).toBe('projects/test-project-2');
    });

    it('should handle special characters in title', async () => {
      const project = await createProject('Projeto Tést!@#$');
      expect(project.path).toBe('projects/projeto-test');
    });
  });

  describe('getProjectById', () => {
    it('should return project by id', async () => {
      const created = await createProject('Test Project');
      const project = await getProjectById(created.id);

      expect(project).not.toBeNull();
      expect(project?.id).toBe(created.id);
      expect(project?.title).toBe('Test Project');
    });

    it('should return null for non-existent id', async () => {
      const project = await getProjectById(999);
      expect(project).toBeNull();
    });
  });

  describe('getProjectWithCards', () => {
    it('should return project with cards and counts', async () => {
      const project = await createProject('Test Project');
      const { createCard } = await import('../services/cardService.js');

      await createCard(project.id, 'Card 1', 'Description 1');
      await createCard(project.id, 'Card 2', 'Description 2');

      const projectWithCards = await getProjectWithCards(project.id);

      expect(projectWithCards).not.toBeNull();
      expect(projectWithCards?.cards).toHaveLength(2);
      expect(projectWithCards?.cardCounts).toEqual({
        todo: 2,
        in_progress: 0,
        done: 0,
      });
    });

    it('should return null for non-existent project', async () => {
      const project = await getProjectWithCards(999);
      expect(project).toBeNull();
    });
  });

  describe('updateProject', () => {
    it('should update project title', async () => {
      const project = await createProject('Old Title');
      const updated = await updateProject(project.id, { title: 'New Title' });

      expect(updated).not.toBeNull();
      expect(updated?.title).toBe('New Title');
    });

    it('should return null for non-existent project', async () => {
      const updated = await updateProject(999, { title: 'New Title' });
      expect(updated).toBeNull();
    });

    it('should return existing project when no fields provided', async () => {
      const project = await createProject('Test Project');
      const updated = await updateProject(project.id, {});

      expect(updated).not.toBeNull();
      expect(updated?.id).toBe(project.id);
    });
  });

  describe('deleteProject', () => {
    it('should delete project', async () => {
      const project = await createProject('Test Project');
      const deleted = await deleteProject(project.id);
      expect(deleted).toBe(true);

      const found = await getProjectById(project.id);
      expect(found).toBeNull();
    });

    it('should delete cards and comments of the project', async () => {
      const project = await createProject('Test Project');
      const card = await createCard(project.id, 'Test Card', 'Description');
      await createComment(card.id, 'Comment 1');

      const deleted = await deleteProject(project.id);
      expect(deleted).toBe(true);

      const comments = await (await import('../services/commentService.js')).listComments(card.id);
      expect(comments).toHaveLength(0);

      const cards = await (await import('../services/cardService.js')).listCards(project.id);
      expect(cards).toHaveLength(0);
    });

    it('should remove project directory', async () => {
      const project = await createProject('Test Project');
      const card = await createCard(project.id, 'Test Card', 'Description');
      await createComment(card.id, 'Comment 1');

      const projectPath = project.path;
      const fullPath = resolve(TEST_BASE_DIR, projectPath);
      await expect(access(fullPath)).resolves.not.toThrow();

      await deleteProject(project.id);
      await expect(access(fullPath)).rejects.toThrow();
    });

    it('should return false for non-existent project', async () => {
      const deleted = await deleteProject(999);
      expect(deleted).toBe(false);
    });
  });
});
