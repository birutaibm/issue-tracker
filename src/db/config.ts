import Knex from "knex";
import { resolve } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, "..");

const DB_DIR = resolve(process.env.HOME || "", "issue-tracker", ".data");
const DB_PATH = resolve(DB_DIR, "database.sqlite");

export const knexConfig = {
  client: "better-sqlite3",
  connection: {
    filename: DB_PATH,
  },
  useNullAsDefault: true,
  migrations: {
    directory: resolve(__dirname, "migrations"),
    tableName: "knex_migrations",
  },
} satisfies Parameters<typeof Knex>[0];

export async function ensureDbDir(): Promise<void> {
  const { mkdir } = await import("fs/promises");
  try {
    await mkdir(DB_DIR, { recursive: true });
  } catch {
    // Directory already exists
  }
}

export { DB_PATH };