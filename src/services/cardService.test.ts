import { describe, it, expect, beforeEach, afterEach, afterAll } from '@jest/globals';
import {
  listCards,
  createCard,
  getCardById,
  getCardByPath,
  getCardWithContent,
  updateCard,
  deleteCard,
} from '../services/cardService.js';
import { createProject } from '../services/projectService.js';
import { createComment } from '../services/commentService.js';
import { mountCommentPath, readCommentFile } from '../services/FileSystem.js';
import { setupTestEnvironment, teardownTestEnvironment } from '../__tests__/test-utils.js';
import {
  setupTestDatabase,
  teardownTestDatabase,
  truncateTestTables,
} from '../__tests__/test-db.js';

describe('Card Service', () => {
  let projectId: number;

  beforeEach(async () => {
    await setupTestEnvironment();
    await setupTestDatabase();
    const project = await createProject('Test Project');
    projectId = project.id;
  });

  afterEach(async () => {
    await truncateTestTables();
  });

  afterAll(async () => {
    await teardownTestDatabase();
    await teardownTestEnvironment();
  });

  describe('listCards', () => {
    it('should return empty array when no cards exist', async () => {
      const cards = await listCards(projectId);
      expect(cards).toEqual([]);
    });

    it('should return cards ordered by created_at desc', async () => {
      await createCard(projectId, 'First Card', 'Desc 1');
      await new Promise((r) => setTimeout(r, 1100));
      await createCard(projectId, 'Second Card', 'Desc 2');
      await new Promise((r) => setTimeout(r, 1100));
      await createCard(projectId, 'Third Card', 'Desc 3');

      const cards = await listCards(projectId);
      expect(cards).toHaveLength(3);
      expect(cards[0].title).toBe('Third Card');
      expect(cards[1].title).toBe('Second Card');
      expect(cards[2].title).toBe('First Card');
    });

    it('should only return cards for the specified project', async () => {
      const otherProject = await createProject('Other Project');
      await createCard(projectId, 'Project 1 Card', 'Desc');
      await createCard(otherProject.id, 'Project 2 Card', 'Desc');

      const cards = await listCards(projectId);
      expect(cards).toHaveLength(1);
      expect(cards[0].title).toBe('Project 1 Card');
    });
  });

  describe('createCard', () => {
    it('should create a new card with todo status', async () => {
      const card = await createCard(projectId, 'Test Card', 'Description');
      expect(card).toMatchObject({
        title: 'Test Card',
        status: 'todo',
        project_id: projectId,
      });
      expect(card.id).toBeDefined();
      expect(card.path).toContain('test-card');
    });

    it('should generate unique slugs for duplicate titles', async () => {
      await createCard(projectId, 'Test Card', 'Desc 1');
      const card2 = await createCard(projectId, 'Test Card', 'Desc 2');
      const card3 = await createCard(projectId, 'Test Card', 'Desc 3');

      expect(card2.path).toContain('test-card-1');
      expect(card3.path).toContain('test-card-2');
    });

    it('should throw error for non-existent project', async () => {
      await expect(createCard(999, 'Test Card', 'Desc')).rejects.toThrow(
        'Project with id 999 not found'
      );
    });
  });

  describe('getCardById', () => {
    it('should return card by id', async () => {
      const created = await createCard(projectId, 'Test Card', 'Description');
      const card = await getCardById(created.id);

      expect(card).not.toBeNull();
      expect(card?.id).toBe(created.id);
      expect(card?.title).toBe('Test Card');
    });

    it('should return null for non-existent id', async () => {
      const card = await getCardById(999);
      expect(card).toBeNull();
    });
  });

  describe('getCardByPath', () => {
    it('should return card by path', async () => {
      const created = await createCard(projectId, 'Test Card', 'Description');
      const card = await getCardByPath(created.path);

      expect(card).not.toBeNull();
      expect(card?.id).toBe(created.id);
    });

    it('should return null for non-existent path', async () => {
      const card = await getCardByPath('projects/non-existent/cards/card.md');
      expect(card).toBeNull();
    });
  });

  describe('getCardWithContent', () => {
    it('should return card with markdown content and comments', async () => {
      const card = await createCard(projectId, 'Test Card', '# Description\n\nContent here');
      const { createComment } = await import('../services/commentService.js');

      await createComment(card.id, 'First comment');
      await createComment(card.id, 'Second comment');

      const cardWithContent = await getCardWithContent(card.id);

      expect(cardWithContent).not.toBeNull();
      expect(cardWithContent?.content).toBe('# Test Card\n\n# Description\n\nContent here');
      expect(cardWithContent?.comments).toHaveLength(2);
      expect(cardWithContent?.project_slug).toBeDefined();
      expect(cardWithContent?.slug).toBeDefined();
    });

    it('should return null for non-existent card', async () => {
      const card = await getCardWithContent(999);
      expect(card).toBeNull();
    });
  });

  describe('updateCard', () => {
    it('should update card title', async () => {
      const card = await createCard(projectId, 'Old Title', 'Description');
      const updated = await updateCard(card.id, { title: 'New Title' });

      expect(updated).not.toBeNull();
      expect(updated?.title).toBe('New Title');
    });

    it('should update card status', async () => {
      const card = await createCard(projectId, 'Test Card', 'Description');
      const updated = await updateCard(card.id, { status: 'in_progress' });

      expect(updated).not.toBeNull();
      expect(updated?.status).toBe('in_progress');
    });

    it('should return null for non-existent card', async () => {
      const updated = await updateCard(999, { title: 'New Title' });
      expect(updated).toBeNull();
    });

    it('should return existing card when no fields provided', async () => {
      const card = await createCard(projectId, 'Test Card', 'Description');
      const updated = await updateCard(card.id, {});

      expect(updated).not.toBeNull();
      expect(updated?.id).toBe(card.id);
    });
  });

  describe('deleteCard', () => {
    it('should delete card', async () => {
      const card = await createCard(projectId, 'Test Card', 'Description');
      const deleted = await deleteCard(card.id);
      expect(deleted).toBe(true);

      const found = await getCardById(card.id);
      expect(found).toBeNull();
    });

    it('should delete comments of the card', async () => {
      const card = await createCard(projectId, 'Test Card', 'Description');
      await createComment(card.id, 'Comment 1');
      await createComment(card.id, 'Comment 2');

      const deleted = await deleteCard(card.id);
      expect(deleted).toBe(true);

      const comments = await (await import('../services/commentService.js')).listComments(card.id);
      expect(comments).toHaveLength(0);
    });

    it('should remove card markdown file and comments directory', async () => {
      const card = await createCard(projectId, 'Test Card', 'Description');
      await createComment(card.id, 'Comment 1');

      const comment = (
        await (await import('../services/commentService.js')).listComments(card.id)
      )[0];
      const commentPath = mountCommentPath(card, comment);
      await expect(readCommentFile(commentPath)).resolves.toBe('Comment 1');

      await deleteCard(card.id);
      await expect(readCommentFile(commentPath)).rejects.toThrow();
    });

    it('should return false for non-existent card', async () => {
      const deleted = await deleteCard(999);
      expect(deleted).toBe(false);
    });
  });
});
