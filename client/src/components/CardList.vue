<script setup lang="ts">
import { ref } from 'vue';

interface Props {
  cards: {
    id: number;
    title: string;
    status: 'todo' | 'in_progress' | 'done';
  }[];
  loading: boolean;
}

interface Emits {
  'card-click': [number];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    todo: '📋 Todo',
    in_progress: '🔄 In Progress',
    done: '✅ Done',
  };
  return labels[status] || status;
}

function getStatusClass(status: string) {
  return `status-${status}`;
}
</script>

<template>
  <div class="card-list">
    <div v-if="loading" class="loading">Loading cards...</div>
    <div v-else-if="props.cards.length === 0" class="empty-state">
      No cards yet. Create your first card!
    </div>
    <div v-else class="cards-grid">
      <div
        v-for="card in props.cards"
        :key="card.id"
        :class="['card-item', getStatusClass(card.status)]"
        @click="emit('card-click', card.id)"
      >
        <div class="card-title">{{ card.title }}</div>
        <div class="card-status">{{ getStatusLabel(card.status) }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.loading,
.empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.card-item {
  background: white;
  border-radius: 8px;
  padding: 1.25rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  border: 1px solid #e0e0e0;
  cursor: pointer;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.card-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-title {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
}

.card-status {
  font-size: 0.875rem;
  font-weight: 500;
}

.card-item.status-todo {
  border-left: 4px solid #ff9800;
}

.card-item.status-in_progress {
  border-left: 4px solid #2196f3;
}

.card-item.status-done {
  border-left: 4px solid #4caf50;
}

.status-todo .card-status {
  color: #e65100;
}
.status-in_progress .card-status {
  color: #1565c0;
}
.status-done .card-status {
  color: #2e7d32;
}
</style>
