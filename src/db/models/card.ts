import { getKnex } from "../client.js";

export type CardStatus = "todo" | "in_progress" | "done";

export interface Card {
  id: number;
  title: string;
  path: string;
  status: CardStatus;
  project_id: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCardInput {
  title: string;
  path: string;
  project_id: number;
  status?: CardStatus;
}

export interface UpdateCardInput {
  title?: string;
  path?: string;
  status?: CardStatus;
  project_id?: number;
}

export async function createCard(input: CreateCardInput): Promise<Card> {
  const knex = getKnex();
  const [card] = await knex("cards").insert(input).returning("*");
  return card;
}

export async function getCardById(id: number): Promise<Card | undefined> {
  const knex = getKnex();
  return knex("cards").where({ id }).first();
}

export async function getCardByPath(path: string): Promise<Card | undefined> {
  const knex = getKnex();
  return knex("cards").where({ path }).first();
}

export async function listCards(projectId?: number): Promise<Card[]> {
  const knex = getKnex();
  const query = knex("cards").orderBy("created_at", "desc");
  if (projectId !== undefined) {
    query.where({ project_id: projectId });
  }
  return query;
}

export async function updateCard(id: number, input: UpdateCardInput): Promise<Card | undefined> {
  const knex = getKnex();
  const [card] = await knex("cards").where({ id }).update(input).returning("*");
  return card;
}

export async function deleteCard(id: number): Promise<boolean> {
  const knex = getKnex();
  const deleted = await knex("cards").where({ id }).delete();
  return deleted > 0;
}