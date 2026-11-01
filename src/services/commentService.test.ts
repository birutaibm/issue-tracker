import { describe, it, expect, beforeEach, afterEach, afterAll } from '@jest/globals';
import { listComments, createComment } from '../services/commentService.js';
import { createProject } from '../services/projectService.js';
import { createCard } from '../services/cardService.js';
import { setupTestEnvironment, teardownTestEnvironment } from '../__tests__/test-utils.js';
import {
  setupTestDatabase,
  teardownTestDatabase,
  truncateTestTables,
} from '../__tests__/test-db.js';

describe('Comment Service', () => {
  let projectId: number;
  let cardId: number;

  beforeEach(async () => {
    await setupTestEnvironment();
    await setupTestDatabase();
    const project = await createProject('Test Project');
    projectId = project.id;
    const card = await createCard(projectId, 'Test Card', 'Description');
    cardId = card.id;
  });

  afterEach(async () => {
    await truncateTestTables();
  });

  afterAll(async () => {
    await teardownTestDatabase();
    await teardownTestEnvironment();
  });

  describe('listComments', () => {
    it('should return empty array when no comments exist', async () => {
      const comments = await listComments(cardId);
      expect(comments).toEqual([]);
    });

    it('should return comments ordered by created_at asc', async () => {
      await createComment(cardId, 'First comment');
      await createComment(cardId, 'Second comment');
      await createComment(cardId, 'Third comment');

      const comments = await listComments(cardId);
      expect(comments).toHaveLength(3);
      expect(comments[0].content).toBe('First comment');
      expect(comments[1].content).toBe('Second comment');
      expect(comments[2].content).toBe('Third comment');
    });

    it('should include comment content from markdown files', async () => {
      await createComment(cardId, 'First comment');
      await createComment(cardId, 'Second comment');

      const comments = await listComments(cardId);
      expect(comments[0]).toHaveProperty('content', 'First comment');
      expect(comments[1]).toHaveProperty('content', 'Second comment');
    });

    it('should only return comments for the specified card', async () => {
      const otherCard = await createCard(projectId, 'Other Card', 'Desc');
      await createComment(cardId, 'Card 1 Comment');
      await createComment(otherCard.id, 'Card 2 Comment');

      const comments = await listComments(cardId);
      expect(comments).toHaveLength(1);
      expect(comments[0].content).toBe('Card 1 Comment');
    });
  });

  describe('createComment', () => {
    it('should create a new comment', async () => {
      const comment = await createComment(cardId, 'Test comment');
      expect(comment).toMatchObject({
        card_id: cardId,
        content: 'Test comment',
      });
      expect(comment.id).toBeDefined();
      expect(comment.created_at).toBeDefined();
      expect(comment.updated_at).toBeDefined();
    });

    it('should throw error for non-existent card', async () => {
      await expect(createComment(999, 'Comment')).rejects.toThrow('Card with id 999 not found');
    });

    it('should persist comment content to markdown file', async () => {
      const _comment = await createComment(cardId, 'Test comment content');

      const comments = await listComments(cardId);
      expect(comments).toHaveLength(1);
      expect(comments[0].content).toBe('Test comment content');
    });
  });
});
