import { listProjects } from '../db/index.js';
import { z } from 'zod';

const name = 'list_projects';

const schema = {
  description: 'List all projects in the issue tracker',
  inputSchema: z.object({}),
};

async function execute() {
  const projects = await listProjects();
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(projects, null, 2) }],
  };
}

export default {
  name,
  schema,
  execute,
};
