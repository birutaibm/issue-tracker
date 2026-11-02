import { asyncHandler } from '../middleware/asyncHandler.js';
import { serveAsset } from '../../services/assetService.js';

export const serve = asyncHandler(async (req, res) => {
  const { projectSlug, cardSlug, filename } = req.params;

  const result = await serveAsset(projectSlug, cardSlug, filename);
  if (!result) {
    return res.status(404).json({ error: 'Asset not found' });
  }

  res.setHeader('Content-Type', result.mimeType);
  res.sendFile(result.path);
});
