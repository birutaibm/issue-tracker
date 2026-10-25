import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  generateSlug,
  ensureUniqueSlug,
  ensureBaseDir,
  ensureProjectDirs,
  validatePath,
  readCardFile,
  writeCardFile,
  getCommentsDir,
  ensureCommentsDir,
  writeCommentFile,
  readCommentFile,
  mountCardPath,
  mountProjectPath,
  mountCommentPath,
} from '../services/FileSystem.js';
import { Project, Card, Comment } from '../db/index.js';
import {
  TEST_BASE_DIR,
  setupTestEnvironment,
  teardownTestEnvironment,
} from '../__tests__/test-utils.js';
import { mkdir, rm } from 'fs/promises';
import { join, resolve } from 'path';

describe('FileSystem Service', () => {
  beforeEach(async () => {
    await setupTestEnvironment();
  });

  afterEach(async () => {
    await teardownTestEnvironment();
  });

  describe('generateSlug', () => {
    it('should convert title to lowercase slug', () => {
      expect(generateSlug('Test Project')).toBe('test-project');
    });

    it('should remove accents', () => {
      expect(generateSlug('Projeto Tést')).toBe('projeto-test');
    });

    it('should replace special characters with hyphens', () => {
      expect(generateSlug('Test@#$Project!')).toBe('test-project');
    });

    it('should trim leading and trailing hyphens', () => {
      expect(generateSlug('---Test---')).toBe('test');
    });

    it('should handle multiple spaces', () => {
      expect(generateSlug('Test   Project')).toBe('test-project');
    });

    it('should handle empty string', () => {
      expect(generateSlug('')).toBe('');
    });
  });

  describe('ensureUniqueSlug', () => {
    it('should return base slug if not taken', async () => {
      const checkFn = async () => false;
      const result = await ensureUniqueSlug('test', checkFn);
      expect(result).toBe('test');
    });

    it('should append counter if slug is taken', async () => {
      let callCount = 0;
      const checkFn = async (slug: string) => {
        callCount++;
        return slug === 'test' || slug === 'test-1';
      };
      const result = await ensureUniqueSlug('test', checkFn);
      expect(result).toBe('test-2');
      expect(callCount).toBe(3);
    });

    it('should handle multiple collisions', async () => {
      const checkFn = async (slug: string) => ['test', 'test-1', 'test-2'].includes(slug);
      const result = await ensureUniqueSlug('test', checkFn);
      expect(result).toBe('test-3');
    });
  });

  describe('ensureBaseDir', () => {
    it('should create base directory if it does not exist', async () => {
      const testDir = join(TEST_BASE_DIR, 'new-base-dir');
      await rm(testDir, { recursive: true, force: true }).catch(() => {});

      await mkdir(testDir, { recursive: true });
      await ensureBaseDir();

      // Should not throw
      await expect(ensureBaseDir()).resolves.not.toThrow();
    });
  });

  describe('ensureProjectDirs', () => {
    it('should create project directories', async () => {
      const projectPath = await ensureProjectDirs('test-project');
      expect(projectPath).toBe(join('projects', 'test-project'));

      const fullPath = resolve(TEST_BASE_DIR, projectPath);
      const cardsPath = join(fullPath, 'cards');

      await expect(mkdir(fullPath, { recursive: true })).resolves.not.toThrow();
      await expect(mkdir(cardsPath, { recursive: true })).resolves.not.toThrow();
    });
  });

  describe('validatePath', () => {
    it('should return resolved path for valid paths', () => {
      const result = validatePath('projects/test/card.md');
      expect(result).toBe(resolve(TEST_BASE_DIR, 'projects/test/card.md'));
    });

    it('should throw for path traversal attempts', () => {
      expect(() => validatePath('../../../etc/passwd')).toThrow(
        'Access denied: path traversal not allowed'
      );
    });

    it('should throw for absolute paths outside base dir', () => {
      expect(() => validatePath('/etc/passwd')).toThrow(
        'Access denied: path traversal not allowed'
      );
    });
  });

  describe('writeCardFile and readCardFile', () => {
    it('should write and read card file', async () => {
      const cardPath = 'projects/test-project/cards/test-card.md';
      const content = '# Test Card\n\nDescription';

      await writeCardFile(cardPath, content);
      const readContent = await readCardFile(cardPath);

      expect(readContent).toBe(content);
    });

    it('should create parent directories when writing', async () => {
      const cardPath = 'projects/new-project/cards/new-card.md';
      const content = '# New Card';

      await writeCardFile(cardPath, content);
      const readContent = await readCardFile(cardPath);

      expect(readContent).toBe(content);
    });

    it('should throw when reading non-existent file', async () => {
      await expect(readCardFile('projects/test/card.md')).rejects.toThrow();
    });
  });

  describe('getCommentsDir', () => {
    it('should return comments directory path', () => {
      const cardPath = 'projects/test/cards/card.md';
      const result = getCommentsDir(cardPath);
      expect(result).toBe('projects/test/cards/card/comments');
    });

    it('should handle paths without .md extension', () => {
      const cardPath = 'projects/test/cards/card';
      const result = getCommentsDir(cardPath);
      expect(result).toBe('projects/test/cards/card/comments');
    });
  });

  describe('ensureCommentsDir', () => {
    it('should create comments directory', async () => {
      const cardPath = 'projects/test-project/cards/test-card.md';
      const commentsDir = await ensureCommentsDir(cardPath);

      expect(commentsDir).toBe('projects/test-project/cards/test-card/comments');

      const fullPath = resolve(TEST_BASE_DIR, commentsDir);
      await expect(mkdir(fullPath, { recursive: true })).resolves.not.toThrow();
    });
  });

  describe('writeCommentFile and readCommentFile', () => {
    it('should write and read comment file', async () => {
      const cardPath = 'projects/test-project/cards/test-card.md';
      const commentId = 1;
      const content = 'This is a comment';

      await writeCommentFile(cardPath, commentId, content);
      const commentPath = join('projects/test-project/cards/test-card/comments', `${commentId}.md`);
      const readContent = await readCommentFile(commentPath);

      expect(readContent).toBe(content);
    });

    it('should create comments directory when writing', async () => {
      const cardPath = 'projects/new-project/cards/new-card.md';
      const content = 'New comment';

      await writeCommentFile(cardPath, 42, content);
      const commentPath = join('projects/new-project/cards/new-card/comments', '42.md');
      const readContent = await readCommentFile(commentPath);

      expect(readContent).toBe(content);
    });
  });

  describe('mountCardPath', () => {
    it('should mount card path correctly', () => {
      const project: Project = {
        id: 1,
        title: 'Test',
        path: 'projects/test-project',
        created_at: '',
        updated_at: '',
      };
      const result = mountCardPath(project, 'test-card');
      expect(result).toBe(join('projects', 'test-project', 'cards', 'test-card.md'));
    });
  });

  describe('mountProjectPath', () => {
    it('should mount project path correctly', () => {
      const result = mountProjectPath('test-project');
      expect(result).toBe(join('projects', 'test-project'));
    });
  });

  describe('mountCommentPath', () => {
    it('should mount comment path correctly', () => {
      const card: Card = {
        id: 1,
        title: 'Test',
        path: 'projects/test-project/cards/test-card.md',
        status: 'todo',
        project_id: 1,
        created_at: '',
        updated_at: '',
      };
      const comment: Comment = {
        id: 5,
        card_id: 1,
        created_at: '',
        updated_at: '',
      };
      const result = mountCommentPath(card, comment);
      expect(result).toBe(
        join('projects', 'test-project', 'cards', 'test-card', 'comments', '5.md')
      );
    });
  });
});
