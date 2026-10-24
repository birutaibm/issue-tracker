import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("comments", (table: Knex.TableBuilder) => {
    table.increments("id").primary();
    table.integer("card_id").notNullable().references("id").inTable("cards").onDelete("CASCADE");
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("comments");
}