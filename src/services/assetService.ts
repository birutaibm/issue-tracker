import { promises as fs } from 'fs';
import { join } from 'path';
import { getProjectByPath } from '../db/models/project.js';
import { getCardByPath } from '../db/models/card.js';
import { validatePath } from './FileSystem.js';
import { lookup } from 'mime-types';

export async function getAssetPath(
  projectSlug: string,
  cardSlug: string,
  filename: string
): Promise<string | null> {
  const project = await getProjectByPath(`projects/${projectSlug}`);
  if (!project) return null;

  const cardPath = join(project.path, 'cards', `${cardSlug}.md`);
  const card = await getCardByPath(cardPath);
  if (!card) return null;

  const assetPath = join(project.path, 'cards', cardSlug, filename);
  return assetPath;
}

export async function serveAsset(
  projectSlug: string,
  cardSlug: string,
  filename: string
): Promise<{ path: string; mimeType: string } | null> {
  const project = await getProjectByPath(`projects/${projectSlug}`);
  if (!project) return null;

  const cardPath = join(project.path, 'cards', `${cardSlug}.md`);
  const card = await getCardByPath(cardPath);
  if (!card) return null;

  const assetPath = join(project.path, 'cards', cardSlug, filename);

  try {
    const fullPath = validatePath(assetPath);
    await fs.access(fullPath);

    const mimeType = lookup(fullPath) || 'application/octet-stream';
    return { path: fullPath, mimeType };
  } catch {
    return null;
  }
}
