import { getProjectById, getCardByPath } from "../db/index.js";
import { createCard, CardStatus } from "../db/models/card.js";
import { generateSlug, ensureUniqueSlug, writeCardFile, mountCardPath } from "../services/FileSystem.js";
import { getKnex } from "../db/client.js";
import { z } from "zod";

const name = "create_card";

const schema = {
  description: "Create a new card in an existing project",
  inputSchema: {
    project_id: z.number().describe("ID of the project"),
    title: z.string().describe("Title of the card"),
    description: z.string().describe("Markdown description of the card"),
    status: z.enum(["todo", "in_progress", "done"]).default("todo").describe("Initial status"),
  },
};

async function execute(args: Record<string, unknown> | undefined) {
  const projectId = args?.project_id as number;
  const title = args?.title as string;
  const description = args?.description as string;
  const status = (args?.status as CardStatus) || "todo";

  if (!projectId || !title || !description) {
    throw new Error("project_id, title, and description are required");
  }

  const project = await getProjectById(projectId);
  if (!project) {
    throw new Error(`Project with id ${projectId} not found`);
  }

  const baseSlug = generateSlug(title);
  const cardSlug = await ensureUniqueSlug(baseSlug, async (slug) => {
    const existing = await getCardByPath(mountCardPath(project, `${slug}.md`));
    return !!existing;
  });

  const cardPath = mountCardPath(project, cardSlug);

  const cardContent = `# ${title}\n\n${description}`;

  const knex = getKnex();
  const [card] = await knex.transaction(async (trx) => {
    await writeCardFile(cardPath, cardContent);

    const [c] = await trx("cards").insert({
      title,
      path: cardPath,
      status,
      project_id: projectId,
    }).returning("*");
    return [c];
  });

  return {
    content: [{ type: "text" as const, text: JSON.stringify(card, null, 2) }],
  };
}

export default {
  name,
  schema,
  execute
};