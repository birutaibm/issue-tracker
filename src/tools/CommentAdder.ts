import { getCardById } from "../db/index.js";
import { writeCommentFile } from "../services/FileSystem.js";
import { getKnex } from "../db/client.js";
import { z } from "zod";

const name = "add_comment";

const schema = {
  description: "Add a comment to a card",
  inputSchema: {
    card_id: z.number().describe("ID of the card"),
    content: z.string().describe("Markdown content of the comment"),
  },
};

async function execute(args: Record<string, unknown> | undefined) {
  const cardId = args?.card_id as number;
  const content = args?.content as string;

  if (!cardId || !content) {
    throw new Error("card_id and content are required");
  }

  const card = await getCardById(cardId);
  if (!card) {
    throw new Error(`Card with id ${cardId} not found`);
  }

  const knex = getKnex();
  const comment = await knex.transaction(async (trx) => {
    const [c] = await trx("comments").insert({ card_id: cardId }).returning("*");
    return c;
  });

  await writeCommentFile(card.path, comment.id, content);

  return {
    content: [{ type: "text" as const, text: JSON.stringify({ ...comment, content }, null, 2) }],
  };
}

export default {
  name,
  schema,
  execute
};