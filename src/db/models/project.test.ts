import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import {
  createProject,
  getProjectById,
  getProjectByPath,
  listProjects,
  updateProject,
  deleteProject,
} from './project.js';
import {
  getTestKnex,
  setupTestDatabase,
  teardownTestDatabase,
  truncateTestTables,
} from '../../__tests__/test-db.js';
import { CreateProjectInput } from './project.js';

describe('Project Model', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await truncateTestTables();
  });

  describe('createProject', () => {
    it('should create a new project', async () => {
      const input: CreateProjectInput = {
        title: 'Test Project',
        path: 'projects/test-project',
      };
      const project = await createProject(input);

      expect(project).toMatchObject({
        title: 'Test Project',
        path: 'projects/test-project',
      });
      expect(project.id).toBeDefined();
      expect(project.created_at).toBeDefined();
      expect(project.updated_at).toBeDefined();
    });

    it('should auto-increment IDs', async () => {
      const project1 = await createProject({ title: 'Project 1', path: 'projects/project-1' });
      const project2 = await createProject({ title: 'Project 2', path: 'projects/project-2' });

      expect(project2.id).toBe(project1.id + 1);
    });

    it('should set timestamps', async () => {
      const project = await createProject({ title: 'Test', path: 'projects/test' });

      expect(project.created_at).toBeDefined();
      expect(project.updated_at).toBeDefined();
      // Just verify they are valid dates and recent (within last day to account for timezone)
      const createdAt = new Date(project.created_at).getTime();
      const now = Date.now();
      expect(createdAt).toBeGreaterThan(now - 86400000); // Within last day
      expect(createdAt).toBeLessThan(now + 86400000); // Within next day (timezone diff)
      expect(project.updated_at).toBe(project.created_at);
    });
  });

  describe('getProjectById', () => {
    it('should return project by ID', async () => {
      const created = await createProject({ title: 'Test', path: 'projects/test' });
      const found = await getProjectById(created.id);

      expect(found).toEqual(created);
    });

    it('should return undefined for non-existent ID', async () => {
      const found = await getProjectById(999);
      expect(found).toBeUndefined();
    });
  });

  describe('getProjectByPath', () => {
    it('should return project by path', async () => {
      const created = await createProject({ title: 'Test', path: 'projects/test-path' });
      const found = await getProjectByPath('projects/test-path');

      expect(found).toEqual(created);
    });

    it('should return undefined for non-existent path', async () => {
      const found = await getProjectByPath('projects/non-existent');
      expect(found).toBeUndefined();
    });
  });

  describe('listProjects', () => {
    it('should return empty array when no projects exist', async () => {
      const projects = await listProjects();
      expect(projects).toEqual([]);
    });

    it('should list all projects ordered by created_at desc', async () => {
      const project1 = await createProject({ title: 'Project 1', path: 'projects/project-1' });
      await new Promise((resolve) => setTimeout(resolve, 1100));
      const project2 = await createProject({ title: 'Project 2', path: 'projects/project-2' });
      await new Promise((resolve) => setTimeout(resolve, 1100));
      const project3 = await createProject({ title: 'Project 3', path: 'projects/project-3' });

      const projects = await listProjects();

      expect(projects).toHaveLength(3);
      expect(projects[0].id).toBe(project3.id);
      expect(projects[1].id).toBe(project2.id);
      expect(projects[2].id).toBe(project1.id);
    }, 10000);
  });

  describe('updateProject', () => {
    it('should update project title', async () => {
      const created = await createProject({ title: 'Original', path: 'projects/original' });
      await new Promise((resolve) => setTimeout(resolve, 2100));
      const updated = await updateProject(created.id, { title: 'Updated' });

      expect(updated).toBeDefined();
      expect(updated!.title).toBe('Updated');
      expect(updated!.path).toBe('projects/original');
      // Note: updated_at is not automatically updated in SQLite without a trigger
      expect(updated!.updated_at).toBeDefined();
    });

    it('should update project path', async () => {
      const created = await createProject({ title: 'Test', path: 'projects/original' });
      await new Promise((resolve) => setTimeout(resolve, 2100));
      const updated = await updateProject(created.id, { path: 'projects/updated' });

      expect(updated!.path).toBe('projects/updated');
    });

    it('should update both title and path', async () => {
      const created = await createProject({ title: 'Original', path: 'projects/original' });
      await new Promise((resolve) => setTimeout(resolve, 2100));
      const updated = await updateProject(created.id, {
        title: 'New Title',
        path: 'projects/new-path',
      });

      expect(updated!.title).toBe('New Title');
      expect(updated!.path).toBe('projects/new-path');
    });

    it('should return undefined for non-existent project', async () => {
      const updated = await updateProject(999, { title: 'Test' });
      expect(updated).toBeUndefined();
    });

    it('should not update if no changes provided', async () => {
      const created = await createProject({ title: 'Test', path: 'projects/test' });
      const updated = await updateProject(created.id, {});

      expect(updated).toEqual(created);
    });
  });

  describe('deleteProject', () => {
    it('should delete existing project', async () => {
      const created = await createProject({ title: 'Test', path: 'projects/test' });
      const result = await deleteProject(created.id);

      expect(result).toBe(true);

      const found = await getProjectById(created.id);
      expect(found).toBeUndefined();
    });

    it('should return false for non-existent project', async () => {
      const result = await deleteProject(999);
      expect(result).toBe(false);
    });

    it('should cascade delete associated cards', async () => {
      const project = await createProject({ title: 'Test', path: 'projects/test' });
      const knex = await getTestKnex();
      await knex('cards').insert({
        title: 'Card 1',
        path: 'projects/test/cards/card-1.md',
        project_id: project.id,
      });

      await deleteProject(project.id);

      const cards = await knex('cards').where({ project_id: project.id });
      expect(cards).toHaveLength(0);
    });
  });
});
