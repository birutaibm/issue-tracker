import { createProject, getProjectByPath } from "../db/index.js";
import { generateSlug, ensureUniqueSlug, ensureProjectDirs, mountProjectPath } from "../services/FileSystem.js";
import { getKnex } from "../db/client.js";
import { z } from "zod";

const name = "create_project";

const schema = {
  description: "Create a new project in the issue tracker",
  inputSchema: {
    title: z.string().describe("Title of the project"),
  },
};

async function execute(args: Record<string, unknown> | undefined) {
  const title = args?.title as string;
  if (!title) {
    throw new Error("Title is required");
  }

  const baseSlug = generateSlug(title);
  const projectSlug = await ensureUniqueSlug(baseSlug, async (slug) => {
    const existing = await getProjectByPath(mountProjectPath(slug));
    return !!existing;
  });

  const projectPath = await ensureProjectDirs(projectSlug);

  const knex = getKnex();
  const [project] = await knex.transaction(async (trx) => {
    const [p] = await trx("projects").insert({
      title,
      path: projectPath,
    }).returning("*");
    return [p];
  });

  return {
    content: [{ type: "text" as const, text: JSON.stringify(project, null, 2) }],
  };
}

export default {
  name,
  schema,
  execute
};