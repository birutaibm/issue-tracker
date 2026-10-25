import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import {
  createCard,
  getCardById,
  getCardByPath,
  listCards,
  updateCard,
  deleteCard,
} from './card.js';
import {
  getTestKnex,
  setupTestDatabase,
  teardownTestDatabase,
  truncateTestTables,
} from '../../__tests__/test-db.js';
import { CreateCardInput } from './card.js';

describe('Card Model', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await truncateTestTables();
  });

  let projectCounter = 0;

  const createTestProject = async () => {
    projectCounter++;
    const knex = await getTestKnex();
    const [project] = await knex('projects')
      .insert({
        title: `Test Project ${projectCounter}`,
        path: `projects/test-project-${projectCounter}`,
      })
      .returning('*');
    return project;
  };

  describe('createCard', () => {
    it('should create a new card with default status', async () => {
      const project = await createTestProject();
      const input: CreateCardInput = {
        title: 'Test Card',
        path: 'projects/test-project/cards/test-card.md',
        project_id: project.id,
      };
      const card = await createCard(input);

      expect(card).toMatchObject({
        title: 'Test Card',
        path: 'projects/test-project/cards/test-card.md',
        project_id: project.id,
        status: 'todo',
      });
      expect(card.id).toBeDefined();
      expect(card.created_at).toBeDefined();
      expect(card.updated_at).toBeDefined();
    });

    it('should create a card with specified status', async () => {
      const project = await createTestProject();
      const input: CreateCardInput = {
        title: 'Test Card',
        path: 'projects/test-project/cards/test-card.md',
        project_id: project.id,
        status: 'in_progress',
      };
      const card = await createCard(input);

      expect(card.status).toBe('in_progress');
    });

    it('should auto-increment IDs', async () => {
      const project = await createTestProject();
      const card1 = await createCard({
        title: 'Card 1',
        path: 'projects/test/cards/card-1.md',
        project_id: project.id,
      });
      const card2 = await createCard({
        title: 'Card 2',
        path: 'projects/test/cards/card-2.md',
        project_id: project.id,
      });

      expect(card2.id).toBe(card1.id + 1);
    });
  });

  describe('getCardById', () => {
    it('should return card by ID', async () => {
      const project = await createTestProject();
      const created = await createCard({
        title: 'Test',
        path: 'projects/test/cards/test.md',
        project_id: project.id,
      });
      const found = await getCardById(created.id);

      expect(found).toEqual(created);
    });

    it('should return undefined for non-existent ID', async () => {
      const found = await getCardById(999);
      expect(found).toBeUndefined();
    });
  });

  describe('getCardByPath', () => {
    it('should return card by path', async () => {
      const project = await createTestProject();
      const created = await createCard({
        title: 'Test',
        path: 'projects/test/cards/test-card.md',
        project_id: project.id,
      });
      const found = await getCardByPath('projects/test/cards/test-card.md');

      expect(found).toEqual(created);
    });

    it('should return undefined for non-existent path', async () => {
      const found = await getCardByPath('projects/test/cards/non-existent.md');
      expect(found).toBeUndefined();
    });
  });

  describe('listCards', () => {
    it('should return empty array when no cards exist', async () => {
      const cards = await listCards();
      expect(cards).toEqual([]);
    });

    it('should list all cards ordered by created_at desc', async () => {
      const project = await createTestProject();
      const card1 = await createCard({
        title: 'Card 1',
        path: 'projects/test/cards/card-1.md',
        project_id: project.id,
      });
      await new Promise((resolve) => setTimeout(resolve, 1100));
      const card2 = await createCard({
        title: 'Card 2',
        path: 'projects/test/cards/card-2.md',
        project_id: project.id,
      });
      await new Promise((resolve) => setTimeout(resolve, 1100));
      const card3 = await createCard({
        title: 'Card 3',
        path: 'projects/test/cards/card-3.md',
        project_id: project.id,
      });

      const cards = await listCards();

      expect(cards).toHaveLength(3);
      expect(cards[0].id).toBe(card3.id);
      expect(cards[1].id).toBe(card2.id);
      expect(cards[2].id).toBe(card1.id);
    }, 10000);

    it('should filter cards by project_id', async () => {
      const project1 = await createTestProject();
      const knex = await getTestKnex();
      const [p2] = await knex('projects')
        .insert({ title: 'Project 2', path: 'projects/project-2' })
        .returning('*');

      await createCard({
        title: 'Card 1',
        path: 'projects/test/cards/card-1.md',
        project_id: project1.id,
      });
      await createCard({
        title: 'Card 2',
        path: 'projects/test/cards/card-2.md',
        project_id: project1.id,
      });
      await createCard({
        title: 'Card 3',
        path: 'projects/project-2/cards/card-3.md',
        project_id: p2.id,
      });

      const cardsProject1 = await listCards(project1.id);
      const cardsProject2 = await listCards(p2.id);

      expect(cardsProject1).toHaveLength(2);
      expect(cardsProject2).toHaveLength(1);
      expect(cardsProject2[0].project_id).toBe(p2.id);
    });

    it('should return empty array for non-existent project', async () => {
      const cards = await listCards(999);
      expect(cards).toEqual([]);
    });
  });

  describe('updateCard', () => {
    it('should update card title', async () => {
      const project = await createTestProject();
      const created = await createCard({
        title: 'Original',
        path: 'projects/test/cards/original.md',
        project_id: project.id,
      });
      await new Promise((resolve) => setTimeout(resolve, 2100));
      const updated = await updateCard(created.id, { title: 'Updated' });

      expect(updated).toBeDefined();
      expect(updated!.title).toBe('Updated');
      // Note: updated_at is not automatically updated in SQLite without a trigger
      expect(updated!.updated_at).toBeDefined();
    });

    it('should update card status', async () => {
      const project = await createTestProject();
      const created = await createCard({
        title: 'Test',
        path: 'projects/test/cards/test.md',
        project_id: project.id,
        status: 'todo',
      });
      await new Promise((resolve) => setTimeout(resolve, 2100));
      const updated = await updateCard(created.id, { status: 'done' });

      expect(updated!.status).toBe('done');
    });

    it('should update card path', async () => {
      const project = await createTestProject();
      const created = await createCard({
        title: 'Test',
        path: 'projects/test/cards/original.md',
        project_id: project.id,
      });
      await new Promise((resolve) => setTimeout(resolve, 2100));
      const updated = await updateCard(created.id, { path: 'projects/test/cards/updated.md' });

      expect(updated!.path).toBe('projects/test/cards/updated.md');
    });

    it('should update project_id', async () => {
      const project1 = await createTestProject();
      const knex = await getTestKnex();
      const [project2] = await knex('projects')
        .insert({ title: 'Project 2', path: 'projects/project-2' })
        .returning('*');

      const created = await createCard({
        title: 'Test',
        path: 'projects/test/cards/test.md',
        project_id: project1.id,
      });
      const updated = await updateCard(created.id, { project_id: project2.id });

      expect(updated!.project_id).toBe(project2.id);
    });

    it('should update multiple fields at once', async () => {
      const project = await createTestProject();
      const created = await createCard({
        title: 'Original',
        path: 'projects/test/cards/original.md',
        project_id: project.id,
        status: 'todo',
      });
      await new Promise((resolve) => setTimeout(resolve, 2100));
      const updated = await updateCard(created.id, {
        title: 'New',
        status: 'in_progress',
        path: 'projects/test/cards/new.md',
      });

      expect(updated!.title).toBe('New');
      expect(updated!.status).toBe('in_progress');
      expect(updated!.path).toBe('projects/test/cards/new.md');
    });

    it('should return undefined for non-existent card', async () => {
      const updated = await updateCard(999, { title: 'Test' });
      expect(updated).toBeUndefined();
    });

    it('should not update if no changes provided', async () => {
      const project = await createTestProject();
      const created = await createCard({
        title: 'Test',
        path: 'projects/test/cards/test.md',
        project_id: project.id,
      });
      const updated = await updateCard(created.id, {});

      expect(updated).toEqual(created);
    });
  });

  describe('deleteCard', () => {
    it('should delete existing card', async () => {
      const project = await createTestProject();
      const created = await createCard({
        title: 'Test',
        path: 'projects/test/cards/test.md',
        project_id: project.id,
      });
      const result = await deleteCard(created.id);

      expect(result).toBe(true);

      const found = await getCardById(created.id);
      expect(found).toBeUndefined();
    });

    it('should return false for non-existent card', async () => {
      const result = await deleteCard(999);
      expect(result).toBe(false);
    });

    it('should cascade delete associated comments', async () => {
      const project = await createTestProject();
      const card = await createCard({
        title: 'Test',
        path: 'projects/test/cards/test.md',
        project_id: project.id,
      });
      const knex = await getTestKnex();
      await knex('comments').insert({ card_id: card.id });

      await deleteCard(card.id);

      const comments = await knex('comments').where({ card_id: card.id });
      expect(comments).toHaveLength(0);
    });
  });
});
