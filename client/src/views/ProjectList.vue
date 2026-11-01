<script setup lang="ts">
import { onMounted } from 'vue';
import { useProjectsStore } from '@/stores/projects';
import { useUIStore } from '@/stores/ui';
import ProjectForm from '@/components/ProjectForm.vue';

const projectsStore = useProjectsStore();
const uiStore = useUIStore();

onMounted(() => {
  projectsStore.fetchProjects();
});

function handleCreateProject() {
  uiStore.openModal('createProject');
}
</script>

<template>
  <div class="project-list-view">
    <div class="view-header">
      <h2>Projects</h2>
      <button class="btn btn-primary" @click="handleCreateProject">+ New Project</button>
    </div>

    <div class="projects-grid" v-if="!projectsStore.loading && projectsStore.projects.length > 0">
      <div class="project-card" v-for="project in projectsStore.projects" :key="project.id">
        <h3>{{ project.title }}</h3>
        <p class="project-path">{{ project.path }}</p>
        <div class="card-counts">
          <span class="count todo">📋 {{ project.cardCounts?.todo || 0 }} todo</span>
          <span class="count in_progress"
            >🔄 {{ project.cardCounts?.in_progress || 0 }} in progress</span
          >
          <span class="count done">✅ {{ project.cardCounts?.done || 0 }} done</span>
        </div>
        <router-link :to="`/projects/${project.id}`" class="btn btn-secondary"> Open </router-link>
      </div>
    </div>

    <p v-if="!projectsStore.loading && projectsStore.projects.length === 0" class="empty-state">
      No projects yet. Create your first project!
    </p>

    <p v-if="projectsStore.loading" class="loading">Loading projects...</p>

    <ProjectForm
      v-if="uiStore.isModalOpen('createProject')"
      @close="uiStore.closeModal('createProject')"
      @saved="uiStore.closeModal('createProject')"
    />
  </div>
</template>

<style scoped>
.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.view-header h2 {
  margin: 0;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.project-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  border: 1px solid #e0e0e0;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.project-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.project-card h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.project-path {
  color: #666;
  font-size: 0.875rem;
  margin: 0 0 1rem 0;
  font-family: monospace;
}

.card-counts {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.count {
  font-size: 0.875rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  background: #f5f5f5;
}

.count.todo {
  background: #fff3e0;
  color: #e65100;
}
.count.in_progress {
  background: #e3f2fd;
  color: #1565c0;
}
.count.done {
  background: #e8f5e9;
  color: #2e7d32;
}

.empty-state {
  text-align: center;
  color: #999;
  padding: 3rem;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background-color 0.2s;
  text-decoration: none;
  display: inline-block;
}

.btn-primary {
  background: #42b883;
  color: white;
}

.btn-primary:hover {
  background: #36a070;
}

.btn-secondary {
  background: #e0e0e0;
  color: #333;
}

.btn-secondary:hover {
  background: #d0d0d0;
}
</style>
