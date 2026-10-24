import Knex from "knex";
import { resolve } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, "..");

const DB_DIR = resolve(process.env.HOME || "", "issue-tracker", ".data");
const DB_PATH = resolve(DB_DIR, "database.sqlite");

const config = {
  client: "better-sqlite3",
  connection: {
    filename: DB_PATH,
  },
  useNullAsDefault: true,
  migrations: {
    directory: resolve(__dirname, "src/db/migrations"),
    tableName: "knex_migrations",
  },
};

export default config;