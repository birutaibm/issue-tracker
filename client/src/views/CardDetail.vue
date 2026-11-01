<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCardsStore } from '@/stores/cards';
import { useUIStore } from '@/stores/ui';
import MarkdownRenderer from '@/components/MarkdownRenderer.vue';
import CommentList from '@/components/CommentList.vue';

const route = useRoute();
const router = useRouter();
const cardsStore = useCardsStore();
const uiStore = useUIStore();

const projectId = Number(route.params.projectId);
const cardId = Number(route.params.cardId);

onMounted(() => {
  cardsStore.fetchCard(cardId);
});

watch(
  () => route.params.cardId,
  (newId) => {
    cardsStore.fetchCard(Number(newId));
  }
);

function goBack() {
  router.push(`/projects/${projectId}`);
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    todo: '📋 Todo',
    in_progress: '🔄 In Progress',
    done: '✅ Done',
  };
  return labels[status] || status;
}
</script>

<template>
  <div class="card-detail-view" v-if="cardsStore.currentCard">
    <div class="view-header">
      <button class="btn btn-secondary" @click="goBack">← Back</button>
      <div class="card-header-info">
        <h2>{{ cardsStore.currentCard.title }}</h2>
        <select
          :value="cardsStore.currentCard.status"
          @change="(e) => cardsStore.updateCard(cardId, { status: e.target.value as any })"
          class="status-select"
        >
          <option value="todo">📋 Todo</option>
          <option value="in_progress">🔄 In Progress</option>
          <option value="done">✅ Done</option>
        </select>
      </div>
    </div>

    <div class="card-content">
      <MarkdownRenderer
        :markdown="cardsStore.currentCard.content"
        :project-slug="cardsStore.currentCard.project_slug || ''"
        :card-slug="cardsStore.currentCard.slug || ''"
      />
    </div>

    <CommentList :card-id="cardId" :comments="cardsStore.currentCard.comments || []" />
  </div>

  <div v-else class="loading">Loading card...</div>
</template>

<style scoped>
.view-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.card-header-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.card-header-info h2 {
  margin: 0;
  flex: 1;
}

.status-select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.875rem;
  background: white;
}

.card-content {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  border: 1px solid #e0e0e0;
  margin-bottom: 2rem;
  min-height: 200px;
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

.btn-secondary {
  background: #e0e0e0;
  color: #333;
}

.btn-secondary:hover {
  background: #d0d0d0;
}
</style>
