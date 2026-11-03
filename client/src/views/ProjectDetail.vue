<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useProjectsStore } from '@/stores/projects';
import { useCardsStore } from '@/stores/cards';
import { useUIStore } from '@/stores/ui';
import CardForm from '@/components/CardForm.vue';
import CardList from '@/components/CardList.vue';

const route = useRoute();
const router = useRouter();
const projectsStore = useProjectsStore();
const cardsStore = useCardsStore();
const uiStore = useUIStore();

const projectId = Number(route.params.projectId);

onMounted(() => {
  projectsStore.fetchProject(projectId);
  cardsStore.fetchCards(projectId);
});

watch(
  () => route.params.projectId,
  (newId) => {
    const id = Number(newId);
    projectsStore.fetchProject(id);
    cardsStore.fetchCards(id);
  }
);

function handleCreateCard() {
  uiStore.openModal('createCard');
}

function handleCardClick(cardId: number) {
  router.push(`/projects/${projectId}/cards/${cardId}`);
}

async function handleDeleteProject() {
  const project = projectsStore.currentProject;
  if (!project) return;

  const confirmed = window.confirm(
    `Delete project "${project.title}" and all of its cards? This cannot be undone.`
  );
  if (!confirmed) return;

  try {
    await projectsStore.deleteProject(project.id);
    router.push('/');
  } catch (err) {
    console.error('Failed to delete project:', err);
  }
}
</script>

<template>
  <div class="project-detail-view" v-if="projectsStore.currentProject">
    <div class="view-header">
      <router-link to="/" class="back-link">← Back to Projects</router-link>
      <div class="header-actions">
        <h2>{{ projectsStore.currentProject.title }}</h2>
        <button class="btn btn-danger" @click="handleDeleteProject">Delete Project</button>
        <button class="btn btn-primary" @click="handleCreateCard">+ New Card</button>
      </div>
    </div>

    <div class="project-meta">
      <span class="path">{{ projectsStore.currentProject.path }}</span>
      <div class="card-counts">
        <span class="count todo">📋 {{ projectsStore.cardCounts.todo }} todo</span>
        <span class="count in_progress"
          >🔄 {{ projectsStore.cardCounts.in_progress }} in progress</span
        >
        <span class="count done">✅ {{ projectsStore.cardCounts.done }} done</span>
      </div>
    </div>

    <CardList
      :cards="cardsStore.cards"
      :loading="cardsStore.loading"
      @card-click="handleCardClick"
    />

    <CardForm
      v-if="uiStore.isModalOpen('createCard')"
      :project-id="projectId"
      @close="uiStore.closeModal('createCard')"
      @saved="uiStore.closeModal('createCard')"
    />
  </div>

  <div v-else class="loading">Loading project...</div>
</template>

<style scoped>
.view-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.back-link {
  color: #42b883;
  text-decoration: none;
  font-size: 0.875rem;
}

.back-link:hover {
  text-decoration: underline;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.header-actions h2 {
  margin: 0;
  flex: 1;
}

.project-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.path {
  font-family: monospace;
  font-size: 0.875rem;
  color: #666;
}

.card-counts {
  display: flex;
  gap: 1rem;
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
}

.btn-primary {
  background: #42b883;
  color: white;
}

.btn-primary:hover {
  background: #36a070;
}

.btn-danger {
  background: #d32f2f;
  color: white;
}

.btn-danger:hover {
  background: #b71c1c;
}
</style>
