import { promises as fs } from 'fs';
import { isAbsolute, join, relative, resolve, sep } from 'path';
import { getProjectByPath } from '../db/models/project.js';
import { getCardByPath } from '../db/models/card.js';
import { getBaseDir } from './FileSystem.js';
import { lookup } from 'mime-types';

interface CardContext {
  projectPath: string;
  cardSlug: string;
}

function getCardAssetsDir(projectPath: string, cardSlug: string): string {
  return resolve(getBaseDir(), projectPath, 'cards', cardSlug);
}

function isInsideDirectory(directory: string, target: string): boolean {
  const relativePath = relative(directory, target);
  return (
    relativePath !== '' &&
    relativePath !== '..' &&
    !relativePath.startsWith(`..${sep}`) &&
    !isAbsolute(relativePath)
  );
}

async function findCardContext(projectSlug: string, cardSlug: string): Promise<CardContext | null> {
  const project = await getProjectByPath(`projects/${projectSlug}`);
  if (!project) return null;

  const cardPath = join(project.path, 'cards', `${cardSlug}.md`);
  const card = await getCardByPath(cardPath);
  if (!card) return null;

  return { projectPath: project.path, cardSlug };
}

export async function getAssetPath(
  projectSlug: string,
  cardSlug: string,
  filename: string
): Promise<string | null> {
  const context = await findCardContext(projectSlug, cardSlug);
  if (!context) return null;

  const assetPath = join(context.projectPath, 'cards', context.cardSlug, filename);
  const assetsDir = getCardAssetsDir(context.projectPath, context.cardSlug);
  const fullPath = resolve(getBaseDir(), assetPath);

  if (!isInsideDirectory(assetsDir, fullPath)) return null;

  return assetPath;
}

export async function serveAsset(
  projectSlug: string,
  cardSlug: string,
  filename: string
): Promise<{ path: string; mimeType: string } | null> {
  const context = await findCardContext(projectSlug, cardSlug);
  if (!context) return null;

  const assetsDir = getCardAssetsDir(context.projectPath, context.cardSlug);
  const requestedPath = resolve(assetsDir, filename);

  // Reject paths that escape the card asset directory (e.g. ../../secret.txt).
  if (!isInsideDirectory(assetsDir, requestedPath)) return null;

  try {
    // Resolve symlinks so a link inside the card directory cannot point outside it.
    const [realAssetsDir, realPath] = await Promise.all([
      fs.realpath(assetsDir),
      fs.realpath(requestedPath),
    ]);

    if (!isInsideDirectory(realAssetsDir, realPath)) return null;

    const stats = await fs.stat(realPath);
    if (!stats.isFile()) return null;

    const mimeType = lookup(realPath) || 'application/octet-stream';
    return { path: realPath, mimeType };
  } catch {
    return null;
  }
}
