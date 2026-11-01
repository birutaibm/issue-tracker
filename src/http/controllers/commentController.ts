import { Request, Response } from 'express';
import { listComments, createComment } from '../../services/commentService.js';

export async function list(req: Request, res: Response) {
  const cardId = Number(req.params.cardId);
  const comments = await listComments(cardId);
  res.json(comments);
}

export async function create(req: Request, res: Response) {
  const cardId = Number(req.params.cardId);
  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }
  const comment = await createComment(cardId, content);
  res.status(201).json(comment);
}
