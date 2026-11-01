import { Request, Response } from 'express';
import {
  listCards,
  createCard,
  getCardWithContent,
  updateCard,
  deleteCard,
} from '../../services/cardService.js';

export async function listByProject(req: Request, res: Response) {
  const projectId = Number(req.params.projectId);
  const cards = await listCards(projectId);
  res.json(cards);
}

export async function create(req: Request, res: Response) {
  const projectId = Number(req.params.projectId);
  const { title, description } = req.body;
  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required' });
  }
  const card = await createCard(projectId, title, description);
  res.status(201).json(card);
}

export async function getById(req: Request, res: Response) {
  const id = Number(req.params.id);
  const card = await getCardWithContent(id);
  if (!card) {
    return res.status(404).json({ error: 'Card not found' });
  }
  res.json(card);
}

export async function update(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { title, status } = req.body;
  const card = await updateCard(id, { title, status });
  if (!card) {
    return res.status(404).json({ error: 'Card not found' });
  }
  res.json(card);
}

export async function remove(req: Request, res: Response) {
  const id = Number(req.params.id);
  const deleted = await deleteCard(id);
  if (!deleted) {
    return res.status(404).json({ error: 'Card not found' });
  }
  res.status(204).send();
}
