import Knex, { Knex as KnexType } from 'knex';
import { knexConfig } from './config.js';

let knexInstance: KnexType | null = null;
let testKnexInstance: KnexType | null = null;

export function getKnex(): KnexType {
  if (testKnexInstance) {
    return testKnexInstance;
  }
  if (!knexInstance) {
    knexInstance = Knex(knexConfig);
  }
  return knexInstance;
}

export function setTestKnexInstance(knex: KnexType): void {
  testKnexInstance = knex;
}

export function clearTestKnexInstance(): void {
  testKnexInstance = null;
}

export async function closeKnex(): Promise<void> {
  if (knexInstance) {
    await knexInstance.destroy();
    knexInstance = null;
  }
  if (testKnexInstance) {
    await testKnexInstance.destroy();
    testKnexInstance = null;
  }
}
