import { getProjectById, listCards } from "../db/index.js";
import { z } from "zod";

const name = "list_cards";

const schema = {
  description: "List all cards in a specific project",
  inputSchema: {
    project_id: z.number().describe("ID of the project"),
  },
};

async function execute(args: Record<string, unknown> | undefined) {
  const projectId = args?.project_id as number;
  if (!projectId) {
    throw new Error("project_id is required");
  }

  const project = await getProjectById(projectId);
  if (!project) {
    throw new Error(`Project with id ${projectId} not found`);
  }

  const cards = await listCards(projectId);
  return {
    content: [{ type: "text" as const, text: JSON.stringify(cards, null, 2) }],
  };
}

export default {
  name,
  schema,
  execute
};