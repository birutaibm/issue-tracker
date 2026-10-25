import { mkdir, rm } from 'fs/promises';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

// Test base directory - this will be used as HOME, so the production config
// will create issue-tracker/.data inside it
export const TEST_BASE_DIR = resolve(__dirname, '..', 'test-data', 'issue-tracker');

// Set HOME to test directory so that FileSystem and DB config use test base dir
export function setTestHome(): void {
  process.env.HOME = TEST_BASE_DIR;
}

export function resetTestHome(): void {
  delete process.env.HOME;
}

export async function setupTestEnvironment(): Promise<void> {
  setTestHome();
  await mkdir(TEST_BASE_DIR, { recursive: true });
  await mkdir(join(TEST_BASE_DIR, 'projects'), { recursive: true });
}

export async function teardownTestEnvironment(): Promise<void> {
  try {
    await rm(TEST_BASE_DIR, { recursive: true, force: true });
  } catch {
    // Ignore errors
  }
  resetTestHome();
}

export function generateTestSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function createMockProject(
  overrides: Partial<{
    id: number;
    title: string;
    path: string;
    created_at: string;
    updated_at: string;
  }> = {}
) {
  return {
    id: 1,
    title: 'Test Project',
    path: 'projects/test-project',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockCard(
  overrides: Partial<{
    id: number;
    title: string;
    path: string;
    status: 'todo' | 'in_progress' | 'done';
    project_id: number;
    created_at: string;
    updated_at: string;
  }> = {}
) {
  return {
    id: 1,
    title: 'Test Card',
    path: 'projects/test-project/cards/test-card.md',
    status: 'todo' as const,
    project_id: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockComment(
  overrides: Partial<{ id: number; card_id: number; created_at: string; updated_at: string }> = {}
) {
  return {
    id: 1,
    card_id: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}
