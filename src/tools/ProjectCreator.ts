import { createProject } from '../services/projectService.js';
import { z } from 'zod';

const name = 'create_project';

const schema = {
  description: 'Create a new project in the issue tracker',
  inputSchema: {
    title: z.string().describe('Title of the project'),
  },
};

async function execute(args: Record<string, unknown> | undefined) {
  const title = args?.title as string;
  if (!title) {
    throw new Error('Title is required');
  }

  const project = await createProject(title);

  return {
    content: [{ type: 'text' as const, text: JSON.stringify(project, null, 2) }],
  };
}

export default {
  name,
  schema,
  execute,
};
