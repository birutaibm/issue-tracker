import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/api/client';
import type {
  Project,
  ProjectWithCards,
  CreateProjectInput,
  UpdateProjectInput,
} from '@shared/types';

export const useProjectsStore = defineStore('projects', () => {
  const projects = ref<Project[]>([]);
  const currentProject = ref<ProjectWithCards | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const cardCounts = computed(() => {
    if (!currentProject.value) return { todo: 0, in_progress: 0, done: 0 };
    return currentProject.value.cardCounts;
  });

  async function fetchProjects() {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get<Project[]>('/projects');
      projects.value = response.data;
    } catch (err) {
      error.value = 'Failed to load projects';
      console.error(err);
    } finally {
      loading.value = false;
    }
  }

  async function fetchProject(id: number) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get<ProjectWithCards>(`/projects/${id}`);
      currentProject.value = response.data;
    } catch (err) {
      error.value = 'Failed to load project';
      console.error(err);
    } finally {
      loading.value = false;
    }
  }

  async function createProject(input: CreateProjectInput) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.post<Project>('/projects', input);
      projects.value.push(response.data);
      return response.data;
    } catch (err) {
      error.value = 'Failed to create project';
      console.error(err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateProject(id: number, input: UpdateProjectInput) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.patch<Project>(`/projects/${id}`, input);
      const index = projects.value.findIndex((p) => p.id === id);
      if (index !== -1) {
        projects.value[index] = response.data;
      }
      if (currentProject.value?.id === id) {
        currentProject.value = { ...currentProject.value, ...response.data };
      }
      return response.data;
    } catch (err) {
      error.value = 'Failed to update project';
      console.error(err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteProject(id: number) {
    loading.value = true;
    error.value = null;
    try {
      await api.delete(`/projects/${id}`);
      projects.value = projects.value.filter((p) => p.id !== id);
      if (currentProject.value?.id === id) {
        currentProject.value = null;
      }
    } catch (err) {
      error.value = 'Failed to delete project';
      console.error(err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function clearCurrentProject() {
    currentProject.value = null;
  }

  return {
    projects,
    currentProject,
    loading,
    error,
    cardCounts,
    fetchProjects,
    fetchProject,
    createProject,
    updateProject,
    deleteProject,
    clearCurrentProject,
  };
});
