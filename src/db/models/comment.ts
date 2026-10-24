import { getKnex } from "../client.js";

export interface Comment {
  id: number;
  card_id: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCommentInput {
  card_id: number;
  content: string;
}

export interface CommentWithContent extends Comment {
  content: string;
}

export async function createComment(input: CreateCommentInput): Promise<Comment> {
  const knex = getKnex();
  const { content, ...dbInput } = input;
  const [comment] = await knex("comments").insert(dbInput).returning("*");
  return comment;
}

export async function getCommentsByCardId(cardId: number): Promise<Comment[]> {
  const knex = getKnex();
  return knex("comments").where({ card_id: cardId }).orderBy("created_at", "asc");
}