import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import CommentAdder from '../tools/CommentAdder.js';
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
import { join } from 'path';

describe('CommentAdder Tool', () => {
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

  it('should add a comment to a card', async () => {
    const project = await createTestProject();
    const card = await createTestCard(project.id);

    const result = await CommentAdder.execute({
      card_id: card.id,
      content: 'This is a comment',
    });

    expect(result).toHaveProperty('content');
    const content = JSON.parse(result.content[0].text);
    expect(content).toMatchObject({
      card_id: card.id,
      content: 'This is a comment',
    });
    expect(content.id).toBeDefined();
    expect(content.created_at).toBeDefined();
    expect(content.updated_at).toBeDefined();
  });

  it('should write comment content to file', async () => {
    const project = await createTestProject();
    const card = await createTestCard(project.id);

    await CommentAdder.execute({
      card_id: card.id,
      content: 'Comment content',
    });

    const fs = await import('fs/promises');
    const knex = await getTestKnex();
    const comments = await knex('comments').where({ card_id: card.id });
    const comment = comments[0];

    const commentPath = join(
      TEST_BASE_DIR,
      'projects/test-project/cards/test-card/comments',
      `${comment.id}.md`
    );
    const fileContent = await fs.readFile(commentPath, 'utf-8');

    expect(fileContent).toBe('Comment content');
  });

  it('should create comments directory if it does not exist', async () => {
    const project = await createTestProject();
    const card = await createTestCard(project.id);

    await CommentAdder.execute({
      card_id: card.id,
      content: 'Comment content',
    });

    const fs = await import('fs/promises');
    const commentsDir = join(TEST_BASE_DIR, 'projects/test-project/cards/test-card/comments');
    await expect(fs.access(commentsDir)).resolves.not.toThrow();
  });

  it('should throw error when card_id is missing', async () => {
    await expect(CommentAdder.execute({ content: 'Comment' })).rejects.toThrow(
      'card_id and content are required'
    );
  });

  it('should throw error when content is missing', async () => {
    const project = await createTestProject();
    const card = await createTestCard(project.id);

    await expect(CommentAdder.execute({ card_id: card.id })).rejects.toThrow(
      'card_id and content are required'
    );
  });

  it('should throw error for non-existent card', async () => {
    await expect(CommentAdder.execute({ card_id: 999, content: 'Comment' })).rejects.toThrow(
      'Card with id 999 not found'
    );
  });

  it('should handle markdown content in comments', async () => {
    const project = await createTestProject();
    const card = await createTestCard(project.id);

    const markdownContent = '# Header\n\n- Item 1\n- Item 2\n\n```js\nconsole.log("code");\n```';

    const result = await CommentAdder.execute({
      card_id: card.id,
      content: markdownContent,
    });

    const content = JSON.parse(result.content[0].text);
    expect(content.content).toBe(markdownContent);
  });

  it('should return comment with timestamps', async () => {
    const project = await createTestProject();
    const card = await createTestCard(project.id);

    const result = await CommentAdder.execute({
      card_id: card.id,
      content: 'Comment',
    });

    const content = JSON.parse(result.content[0].text);

    expect(content.created_at).toBeDefined();
    expect(content.updated_at).toBeDefined();
    // Just verify they are valid dates
    expect(new Date(content.created_at).toString()).not.toBe('Invalid Date');
    expect(new Date(content.updated_at).toString()).not.toBe('Invalid Date');
  });

  it('should create multiple comments on same card', async () => {
    const project = await createTestProject();
    const card = await createTestCard(project.id);

    await CommentAdder.execute({ card_id: card.id, content: 'Comment 1' });
    await CommentAdder.execute({ card_id: card.id, content: 'Comment 2' });
    const result = await CommentAdder.execute({ card_id: card.id, content: 'Comment 3' });

    const content = JSON.parse(result.content[0].text);
    expect(content.content).toBe('Comment 3');

    const knex = await getTestKnex();
    const comments = await knex('comments').where({ card_id: card.id });
    expect(comments).toHaveLength(3);
  });
});
