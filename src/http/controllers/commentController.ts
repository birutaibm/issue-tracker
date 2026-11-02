import { asyncHandler } from '../middleware/asyncHandler.js';
import { listComments, createComment, deleteComment } from '../../services/commentService.js';

export const list = asyncHandler(async (req, res) => {
  const cardId = Number(req.params.cardId);
  const comments = await listComments(cardId);
  res.json(comments);
});

export const create = asyncHandler(async (req, res) => {
  const cardId = Number(req.params.cardId);
  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }
  const comment = await createComment(cardId, content);
  res.status(201).json(comment);
});

export const remove = asyncHandler(async (req, res) => {
  const cardId = Number(req.params.cardId);
  const id = Number(req.params.id);
  const deleted = await deleteComment(id, cardId);
  if (!deleted) {
    return res.status(404).json({ error: 'Comment not found' });
  }
  res.status(204).send();
});
