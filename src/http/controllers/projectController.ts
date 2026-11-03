import { asyncHandler } from '../middleware/asyncHandler.js';
import {
  listProjects,
  createProject,
  getProjectWithCards,
  updateProject,
  deleteProject,
} from '../../services/projectService.js';

export const list = asyncHandler(async (_req, res) => {
  const projects = await listProjects();
  res.json(projects);
});

export const create = asyncHandler(async (req, res) => {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  const project = await createProject(title);
  res.status(201).json(project);
});

export const getById = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const project = await getProjectWithCards(id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  res.json(project);
});

export const update = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  const project = await updateProject(id, { title });
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  res.json(project);
});

export const remove = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const deleted = await deleteProject(id);
  if (!deleted) {
    return res.status(404).json({ error: 'Project not found' });
  }
  res.status(204).send();
});
