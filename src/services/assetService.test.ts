import { describe, it, expect, beforeEach, afterEach, afterAll } from '@jest/globals';
import { getAssetPath, serveAsset } from '../services/assetService.js';
import { createProject } from '../services/projectService.js';
import { createCard } from '../services/cardService.js';
import { setupTestEnvironment, teardownTestEnvironment } from '../__tests__/test-utils.js';
import {
  setupTestDatabase,
  teardownTestDatabase,
  truncateTestTables,
} from '../__tests__/test-db.js';
import { writeFile, mkdir, symlink } from 'fs/promises';
import { join } from 'path';

describe('Asset Service', () => {
  let projectId: number;
  let projectSlug: string;
  let cardSlug: string;

  beforeEach(async () => {
    await setupTestEnvironment();
    await setupTestDatabase();
    const project = await createProject('Test Project');
    projectId = project.id;
    projectSlug = project.path.split('/').pop() || 'test-project';
    const card = await createCard(projectId, 'Test Card', 'Description');
    cardSlug = card.path.split('/').pop()?.replace('.md', '') || 'test-card';

    // Create asset directory and test file
    const assetDir = join(process.env.HOME || '', 'projects', projectSlug, 'cards', cardSlug);
    await mkdir(assetDir, { recursive: true });
    const testFile = join(assetDir, 'test-image.png');
    await writeFile(testFile, Buffer.from('fake-image-data'));
  });

  afterEach(async () => {
    await truncateTestTables();
  });

  afterAll(async () => {
    await teardownTestDatabase();
    await teardownTestEnvironment();
  });

  describe('getAssetPath', () => {
    it('should return asset path for valid project and card', async () => {
      const path = await getAssetPath(projectSlug, cardSlug, 'test-image.png');
      expect(path).toBe(join('projects', projectSlug, 'cards', cardSlug, 'test-image.png'));
    });

    it('should return null for non-existent project', async () => {
      const path = await getAssetPath('non-existent', cardSlug, 'test.png');
      expect(path).toBeNull();
    });

    it('should return null for non-existent card', async () => {
      const path = await getAssetPath(projectSlug, 'non-existent', 'test.png');
      expect(path).toBeNull();
    });

    it('should return null for paths outside the card assets directory', async () => {
      const path = await getAssetPath(projectSlug, cardSlug, '../../../../secret.txt');
      expect(path).toBeNull();
    });
  });

  describe('serveAsset', () => {
    it('should return file path and mime type for existing asset', async () => {
      const result = await serveAsset(projectSlug, cardSlug, 'test-image.png');
      expect(result).not.toBeNull();
      expect(result?.mimeType).toBe('image/png');
      expect(result?.path).toContain('test-image.png');
    });

    it('should return null for non-existent project', async () => {
      const result = await serveAsset('non-existent', cardSlug, 'test.png');
      expect(result).toBeNull();
    });

    it('should return null for non-existent card', async () => {
      const result = await serveAsset(projectSlug, 'non-existent', 'test.png');
      expect(result).toBeNull();
    });

    it('should return null for non-existent file', async () => {
      const result = await serveAsset(projectSlug, cardSlug, 'non-existent.png');
      expect(result).toBeNull();
    });

    it('should return null for paths outside the card assets directory', async () => {
      const secretPath = join(process.env.HOME || '', 'secret.txt');
      await writeFile(secretPath, 'top secret');

      const result = await serveAsset(projectSlug, cardSlug, '../../../../secret.txt');
      expect(result).toBeNull();
    });

    it('should return null for absolute paths outside the card assets directory', async () => {
      const result = await serveAsset(projectSlug, cardSlug, '/etc/passwd');
      expect(result).toBeNull();
    });

    it('should return null for symlinks that escape the card assets directory', async () => {
      const secretPath = join(process.env.HOME || '', 'outside-secret.txt');
      await writeFile(secretPath, 'top secret');

      const linkPath = join(
        process.env.HOME || '',
        'projects',
        projectSlug,
        'cards',
        cardSlug,
        'outside-link.txt'
      );
      await symlink(secretPath, linkPath);

      const result = await serveAsset(projectSlug, cardSlug, 'outside-link.txt');
      expect(result).toBeNull();
    });

    it('should return correct mime types for different extensions', async () => {
      const testCases = [
        { ext: 'png', mime: 'image/png' },
        { ext: 'jpg', mime: 'image/jpeg' },
        { ext: 'jpeg', mime: 'image/jpeg' },
        { ext: 'gif', mime: 'image/gif' },
        { ext: 'svg', mime: 'image/svg+xml' },
        { ext: 'webp', mime: 'image/webp' },
        { ext: 'pdf', mime: 'application/pdf' },
        { ext: 'txt', mime: 'text/plain' },
        { ext: 'md', mime: 'text/markdown' },
        { ext: 'json', mime: 'application/json' },
      ];

      for (const { ext, mime } of testCases) {
        const fileName = `test.${ext}`;
        const filePath = join(
          process.env.HOME || '',
          'projects',
          projectSlug,
          'cards',
          cardSlug,
          fileName
        );
        await writeFile(filePath, Buffer.from('test'));

        const result = await serveAsset(projectSlug, cardSlug, fileName);
        expect(result).not.toBeNull();
        expect(result?.mimeType).toBe(mime);
      }
    });

    it('should return application/octet-stream for unknown extensions', async () => {
      const fileName = 'test.unknown';
      const filePath = join(
        process.env.HOME || '',
        'projects',
        projectSlug,
        'cards',
        cardSlug,
        fileName
      );
      await writeFile(filePath, Buffer.from('test'));

      const result = await serveAsset(projectSlug, cardSlug, fileName);
      expect(result).not.toBeNull();
      expect(result?.mimeType).toBe('application/octet-stream');
    });
  });
});
