import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import CardReader from '../tools/CardReader.js';
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
import { rm, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

describe('CardReader Tool', () => {
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

  const createTestCard = async (
    projectId: number,
    title = 'Test Card',
    path = 'projects/test-project/cards/test-card.md'
  ) => {
    const knex = await getTestKnex();
    const [card] = await knex('cards')
      .insert({
        title,
        path,
        project_id: projectId,
      })
      .returning('*');
    return card;
  };

  const createTestComment = async (cardId: number) => {
    const knex = await getTestKnex();
    const [comment] = await knex('comments').insert({ card_id: cardId }).returning('*');
    return comment;
  };

  const writeCardFileContent = async (cardPath: string, content: string) => {
    const fullPath = join(TEST_BASE_DIR, cardPath);
    await mkdir(join(fullPath, '..'), { recursive: true });
    await writeFile(fullPath, content, 'utf-8');
  };

  const writeCommentFileContent = async (cardPath: string, commentId: number, content: string) => {
    const commentsDir = cardPath.replace(/\.md$/, '') + '/comments';
    const fullDir = join(TEST_BASE_DIR, commentsDir);
    await mkdir(fullDir, { recursive: true });
    const commentPath = join(fullDir, `${commentId}.md`);
    await writeFile(commentPath, content, 'utf-8');
  };

  it('should read card by ID with content', async () => {
    const project = await createTestProject();
    const card = await createTestCard(project.id);
    await writeCardFileContent(card.path, '# Test Card\n\nCard content');

    const result = await CardReader.execute({ card_id: card.id });
    const content = JSON.parse(result.content[0].text);

    expect(content).toMatchObject({
      id: card.id,
      title: 'Test Card',
      path: card.path,
      project_id: project.id,
    });
    expect(content.content).toBe('# Test Card\n\nCard content');
    expect(content.comments).toEqual([]);
  });

  it('should read card by path with content', async () => {
    const project = await createTestProject();
    const card = await createTestCard(
      project.id,
      'Test Card',
      'projects/test-project/cards/test-card.md'
    );
    await writeCardFileContent(card.path, '# Test Card\n\nCard content');

    const result = await CardReader.execute({ card_path: card.path });
    const content = JSON.parse(result.content[0].text);

    expect(content.content).toBe('# Test Card\n\nCard content');
  });

  it('should include comments with content', async () => {
    const project = await createTestProject();
    const card = await createTestCard(project.id);
    await writeCardFileContent(card.path, '# Test Card\n\nContent');

    const comment1 = await createTestComment(card.id);
    const comment2 = await createTestComment(card.id);
    await writeCommentFileContent(card.path, comment1.id, 'First comment');
    await writeCommentFileContent(card.path, comment2.id, 'Second comment');

    const result = await CardReader.execute({ card_id: card.id });
    const content = JSON.parse(result.content[0].text);

    expect(content.comments).toHaveLength(2);
    expect(content.comments[0]).toMatchObject({
      id: comment1.id,
      card_id: card.id,
      content: 'First comment',
    });
    expect(content.comments[1]).toMatchObject({
      id: comment2.id,
      card_id: card.id,
      content: 'Second comment',
    });
  });

  it('should order comments by created_at asc', async () => {
    const project = await createTestProject();
    const card = await createTestCard(project.id);
    await writeCardFileContent(card.path, '# Test Card\n\nContent');

    const comment1 = await createTestComment(card.id);
    const comment2 = await createTestComment(card.id);
    const comment3 = await createTestComment(card.id);
    await writeCommentFileContent(card.path, comment1.id, 'First');
    await writeCommentFileContent(card.path, comment2.id, 'Second');
    await writeCommentFileContent(card.path, comment3.id, 'Third');

    const result = await CardReader.execute({ card_id: card.id });
    const content = JSON.parse(result.content[0].text);

    expect(content.comments[0].id).toBe(comment1.id);
    expect(content.comments[1].id).toBe(comment2.id);
    expect(content.comments[2].id).toBe(comment3.id);
  });

  it('should skip comments with missing files', async () => {
    const project = await createTestProject();
    const card = await createTestCard(project.id);
    await writeCardFileContent(card.path, '# Test Card\n\nContent');

    const comment1 = await createTestComment(card.id);
    await writeCommentFileContent(card.path, comment1.id, 'Has file');

    const result = await CardReader.execute({ card_id: card.id });
    const content = JSON.parse(result.content[0].text);

    expect(content.comments).toHaveLength(1);
    expect(content.comments[0].id).toBe(comment1.id);
  });

  it('should throw error when card not found by ID', async () => {
    await expect(CardReader.execute({ card_id: 999 })).rejects.toThrow('Card not found');
  });

  it('should throw error when card not found by path', async () => {
    await expect(
      CardReader.execute({ card_path: 'projects/non-existent/cards/card.md' })
    ).rejects.toThrow('Card not found');
  });

  it('should throw error when neither card_id nor card_path provided', async () => {
    await expect(CardReader.execute({})).rejects.toThrow('Either card_id or card_path is required');
  });

  it('should throw error when card file does not exist', async () => {
    const project = await createTestProject();
    const card = await createTestCard(project.id);
    // Don't create the card file

    await expect(CardReader.execute({ card_id: card.id })).rejects.toThrow();
  });
});
