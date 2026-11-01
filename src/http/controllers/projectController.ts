import { Request, Response } from 'express';
import {
  listProjects,
  createProject,
  getProjectWithCards,
  updateProject,
  deleteProject,
} from '../../services/projectService.js';

export async function list(req: Request, res: Response) {
  const projects = await listProjects();
  res.json(projects);
}

export async function create(req: Request, res: Response) {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  const project = await createProject(title);
  res.status(201).json(project);
}

export async function getById(req: Request, res: Response) {
  const id = Number(req.params.id);
  const project = await getProjectWithCards(id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  res.json(project);
}

export async function update(req: Request, res: Response) {
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
}

export async function remove(req: Request, res: Response) {
  const id = Number(req.params.id);
  const deleted = await deleteProject(id);
  if (!deleted) {
    return res.status(404).json({ error: 'Project not found' });
  }
  res.status(204).send();
}
