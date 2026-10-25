import Knex, { Knex as KnexType } from 'knex';
import { fileURLToPath } from 'url';
import { resolve } from 'path';
import { setupTestEnvironment } from './test-utils.js';
import { setTestKnexInstance, clearTestKnexInstance } from '../db/client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..', '..');

let testKnexInstance: KnexType | null = null;

export function getTestKnexConfig() {
  // Use shared in-memory database to allow multiple connections to see the same data
  return {
    client: 'better-sqlite3',
    connection: {
      filename: 'file::memory:?cache=shared',
    },
    useNullAsDefault: true,
    migrations: {
      directory: resolve(__dirname, 'db/migrations'),
      tableName: 'knex_migrations',
    },
  };
}

export async function getTestKnex(): Promise<KnexType> {
  if (!testKnexInstance) {
    testKnexInstance = Knex(getTestKnexConfig());
    setTestKnexInstance(testKnexInstance);
  }
  return testKnexInstance;
}

export async function runTestMigrations(): Promise<void> {
  const knex = await getTestKnex();
  await knex.migrate.latest();
}

export async function rollbackTestMigrations(): Promise<void> {
  const knex = await getTestKnex();
  await knex.migrate.rollback();
}

export async function closeTestKnex(): Promise<void> {
  if (testKnexInstance) {
    await testKnexInstance.destroy();
    testKnexInstance = null;
    clearTestKnexInstance();
  }
}

export async function setupTestDatabase(): Promise<void> {
  await setupTestEnvironment();
  await runTestMigrations();
}

export async function teardownTestDatabase(): Promise<void> {
  await closeTestKnex();
}

export async function truncateTestTables(): Promise<void> {
  const knex = await getTestKnex();
  await knex('comments').delete();
  await knex('cards').delete();
  await knex('projects').delete();
}

export function resetTestKnex(): void {
  if (testKnexInstance) {
    testKnexInstance.destroy();
    testKnexInstance = null;
    clearTestKnexInstance();
  }
}
