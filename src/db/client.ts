import Knex, { Knex as KnexType } from "knex";
import { knexConfig } from "./config.js";

let knexInstance: KnexType | null = null;

export function getKnex(): KnexType {
  if (!knexInstance) {
    knexInstance = Knex(knexConfig);
  }
  return knexInstance;
}

export async function closeKnex(): Promise<void> {
  if (knexInstance) {
    await knexInstance.destroy();
    knexInstance = null;
  }
}