import { asyncHandler } from '../middleware/asyncHandler.js';
import {
  listCards,
  createCard,
  getCardWithContent,
  updateCard,
  deleteCard,
} from '../../services/cardService.js';
import type { CardStatus, UpdateCardInput } from '../../shared/types.js';

const CARD_STATUSES: CardStatus[] = ['todo', 'in_progress', 'done'];

export const listByProject = asyncHandler(async (req, res) => {
  const projectId = Number(req.params.projectId);
  const cards = await listCards(projectId);
  res.json(cards);
});

export const create = asyncHandler(async (req, res) => {
  const projectId = Number(req.params.projectId);
  const { title, description } = req.body;
  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required' });
  }
  const card = await createCard(projectId, title, description);
  res.status(201).json(card);
});

export const getById = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const card = await getCardWithContent(id);
  if (!card) {
    return res.status(404).json({ error: 'Card not found' });
  }
  res.json(card);
});

export const update = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { title, status, content } = req.body;

  if (status !== undefined && !CARD_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Invalid card status' });
  }

  const input: UpdateCardInput = {};
  if (title !== undefined) input.title = title;
  if (status !== undefined) input.status = status;
  if (content !== undefined) input.content = content;

  const card = await updateCard(id, input);
  if (!card) {
    return res.status(404).json({ error: 'Card not found' });
  }

  // include the markdown content in the response when it was edited
  res.json(content !== undefined ? { ...card, content } : card);
});

export const remove = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const deleted = await deleteCard(id);
  if (!deleted) {
    return res.status(404).json({ error: 'Card not found' });
  }
  res.status(204).send();
});
