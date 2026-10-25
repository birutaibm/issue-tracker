import { getKnex } from '../client.js';

export interface Project {
  id: number;
  title: string;
  path: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectInput {
  title: string;
  path: string;
}

export interface UpdateProjectInput {
  title?: string;
  path?: string;
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const knex = getKnex();
  const [project] = await knex('projects').insert(input).returning('*');
  return project;
}

export async function getProjectById(id: number): Promise<Project | undefined> {
  const knex = getKnex();
  return knex('projects').where({ id }).first();
}

export async function getProjectByPath(path: string): Promise<Project | undefined> {
  const knex = getKnex();
  return knex('projects').where({ path }).first();
}

export async function listProjects(): Promise<Project[]> {
  const knex = getKnex();
  return knex('projects').orderBy('created_at', 'desc');
}

export async function updateProject(
  id: number,
  input: UpdateProjectInput
): Promise<Project | undefined> {
  const knex = getKnex();
  // If no fields to update, return the existing project
  if (Object.keys(input).length === 0) {
    return getProjectById(id);
  }
  const [project] = await knex('projects').where({ id }).update(input).returning('*');
  return project;
}

export async function deleteProject(id: number): Promise<boolean> {
  const knex = getKnex();
  const deleted = await knex('projects').where({ id }).delete();
  return deleted > 0;
}
