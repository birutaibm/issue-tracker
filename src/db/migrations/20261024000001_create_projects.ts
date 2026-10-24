import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("projects", (table: Knex.TableBuilder) => {
    table.increments("id").primary();
    table.text("title").notNullable();
    table.text("path").notNullable().unique();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("projects");
}