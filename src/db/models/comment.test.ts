import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { createComment, getCommentsByCardId } from './comment.js';
import {
  getTestKnex,
  setupTestDatabase,
  teardownTestDatabase,
  truncateTestTables,
} from '../../__tests__/test-db.js';
import { CreateCommentInput } from './comment.js';

describe('Comment Model', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await truncateTestTables();
  });

  const createTestProject = async () => {
    const knex = await getTestKnex();
    const [project] = await knex('projects')
      .insert({
        title: 'Test Project',
        path: 'projects/test-project',
      })
      .returning('*');
    return project;
  };

  const createTestCard = async (projectId: number) => {
    const knex = await getTestKnex();
    const [card] = await knex('cards')
      .insert({
        title: 'Test Card',
        path: 'projects/test-project/cards/test-card.md',
        project_id: projectId,
      })
      .returning('*');
    return card;
  };

  describe('createComment', () => {
    it('should create a new comment', async () => {
      const project = await createTestProject();
      const card = await createTestCard(project.id);
      const input: CreateCommentInput = {
        card_id: card.id,
        content: 'This is a comment',
      };
      const comment = await createComment(input);

      expect(comment).toMatchObject({
        card_id: card.id,
      });
      expect(comment.id).toBeDefined();
      expect(comment.created_at).toBeDefined();
      expect(comment.updated_at).toBeDefined();
    });

    it('should not store content in database', async () => {
      const project = await createTestProject();
      const card = await createTestCard(project.id);
      const input: CreateCommentInput = {
        card_id: card.id,
        content: 'This is a comment',
      };
      const comment = await createComment(input);

      expect(comment).not.toHaveProperty('content');
    });

    it('should auto-increment IDs', async () => {
      const project = await createTestProject();
      const card = await createTestCard(project.id);
      const comment1 = await createComment({ card_id: card.id, content: 'Comment 1' });
      const comment2 = await createComment({ card_id: card.id, content: 'Comment 2' });

      expect(comment2.id).toBe(comment1.id + 1);
    });
  });

  describe('getCommentsByCardId', () => {
    it('should return empty array when no comments exist', async () => {
      const project = await createTestProject();
      const card = await createTestCard(project.id);
      const comments = await getCommentsByCardId(card.id);
      expect(comments).toEqual([]);
    });

    it('should return comments ordered by created_at asc', async () => {
      const project = await createTestProject();
      const card = await createTestCard(project.id);

      const comment1 = await createComment({ card_id: card.id, content: 'First comment' });
      await new Promise((resolve) => setTimeout(resolve, 10));
      const comment2 = await createComment({ card_id: card.id, content: 'Second comment' });
      await new Promise((resolve) => setTimeout(resolve, 10));
      const comment3 = await createComment({ card_id: card.id, content: 'Third comment' });

      const comments = await getCommentsByCardId(card.id);

      expect(comments).toHaveLength(3);
      expect(comments[0].id).toBe(comment1.id);
      expect(comments[1].id).toBe(comment2.id);
      expect(comments[2].id).toBe(comment3.id);
    });

    it('should only return comments for the specified card', async () => {
      const project = await createTestProject();
      const card1 = await createTestCard(project.id);
      const knex = await getTestKnex();
      const [card2] = await knex('cards')
        .insert({
          title: 'Card 2',
          path: 'projects/test-project/cards/card-2.md',
          project_id: project.id,
        })
        .returning('*');

      await createComment({ card_id: card1.id, content: 'Comment on card 1' });
      await createComment({ card_id: card1.id, content: 'Another comment on card 1' });
      await createComment({ card_id: card2.id, content: 'Comment on card 2' });

      const commentsCard1 = await getCommentsByCardId(card1.id);
      const commentsCard2 = await getCommentsByCardId(card2.id);

      expect(commentsCard1).toHaveLength(2);
      expect(commentsCard2).toHaveLength(1);
      expect(commentsCard2[0].card_id).toBe(card2.id);
    });

    it('should return empty array for non-existent card', async () => {
      const comments = await getCommentsByCardId(999);
      expect(comments).toEqual([]);
    });
  });
});
