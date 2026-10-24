import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("cards", (table: Knex.TableBuilder) => {
    table.increments("id").primary();
    table.text("title").notNullable();
    table.text("path").notNullable();
    table.text("status").notNullable().defaultTo("todo");
    table.integer("project_id").notNullable().references("id").inTable("projects").onDelete("CASCADE");
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("cards");
}