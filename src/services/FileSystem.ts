import { promises as fs } from "fs";
import { join, resolve, relative } from "path";
import { Card, Project } from "../db/index.js";
import { Comment } from "../db/models/comment.js";

export const BASE_DIR = resolve(process.env.HOME || "", "issue-tracker");

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function ensureUniqueSlug(baseSlug: string, checkFn: (slug: string) => Promise<boolean>): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  while (await checkFn(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
}

export async function ensureBaseDir(): Promise<void> {
  try {
    await fs.access(BASE_DIR);
  } catch {
    await fs.mkdir(BASE_DIR, { recursive: true });
  }
}

export async function ensureProjectDirs(projectSlug: string): Promise<string> {
  const projectPath = join("projects", projectSlug);
  const fullPath = resolve(BASE_DIR, projectPath);
  await fs.mkdir(fullPath, { recursive: true });
  await fs.mkdir(join(fullPath, "cards"), { recursive: true });
  return projectPath;
}

export function validatePath(requestedPath: string): string {
  const fullPath = resolve(BASE_DIR, requestedPath);
  const relativePath = relative(BASE_DIR, fullPath);
  
  if (relativePath.startsWith("..") || fullPath.startsWith("..")) {
    throw new Error("Access denied: path traversal not allowed");
  }
  
  return fullPath;
}

export async function readCardFile(cardPath: string): Promise<string> {
  const fullPath = validatePath(cardPath);
  const content = await fs.readFile(fullPath, "utf-8");
  return content;
}

export function getCommentsDir(cardPath: string): string {
  return cardPath.replace(/\.md$/, "") + "/comments";
}

export async function ensureCommentsDir(cardPath: string): Promise<string> {
  const commentsDir = getCommentsDir(cardPath);
  const fullPath = resolve(BASE_DIR, commentsDir);
  await fs.mkdir(fullPath, { recursive: true });
  return commentsDir;
}

export async function writeCommentFile(cardPath: string, commentId: number | string, content: string): Promise<void> {
  const commentsDir = await ensureCommentsDir(cardPath);
  const commentPath = join(commentsDir, `${commentId}.md`);
  const fullPath = validatePath(commentPath);
  await fs.writeFile(fullPath, content, "utf-8");
}

export async function readCommentFile(commentPath: string): Promise<string> {
  const fullPath = validatePath(commentPath);
  const content = await fs.readFile(fullPath, "utf-8");
  return content;
}

export async function writeCardFile(cardPath: string, content: string): Promise<void> {
  const fullPath = validatePath(cardPath);
  await fs.mkdir(join(fullPath, ".."), { recursive: true });
  await fs.writeFile(fullPath, content, "utf-8");
}
export function mountCardPath(project: Project, cardSlug: string) {
  return join(project.path, "cards", `${cardSlug}.md`);
}export function mountProjectPath(slug: string): string {
  return join("projects", slug);
}
export function mountCommentPath(card: Card, comment: Comment) {
  return join(getCommentsDir(card.path), `${comment.id}.md`);
}

