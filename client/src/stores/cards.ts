import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/api/client';
import type { Card, CardWithContent, CreateCardInput, UpdateCardInput } from '@shared/types';

export const useCardsStore = defineStore('cards', () => {
  const cards = ref<Card[]>([]);
  const currentCard = ref<CardWithContent | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchCards(projectId: number) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get<Card[]>(`/projects/${projectId}/cards`);
      cards.value = response.data;
    } catch (err) {
      error.value = 'Failed to load cards';
      console.error(err);
    } finally {
      loading.value = false;
    }
  }

  async function fetchCard(id: number) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get<CardWithContent>(`/cards/${id}`);
      currentCard.value = response.data;
    } catch (err) {
      error.value = 'Failed to load card';
      console.error(err);
    } finally {
      loading.value = false;
    }
  }

  async function createCard(projectId: number, input: CreateCardInput) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.post<Card>(`/projects/${projectId}/cards`, input);
      cards.value.push(response.data);
      return response.data;
    } catch (err) {
      error.value = 'Failed to create card';
      console.error(err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateCard(id: number, input: UpdateCardInput) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.patch<Card>(`/cards/${id}`, input);
      const index = cards.value.findIndex((c) => c.id === id);
      if (index !== -1) {
        cards.value[index] = response.data;
      }
      if (currentCard.value?.id === id) {
        currentCard.value = { ...currentCard.value, ...response.data };
      }
      return response.data;
    } catch (err) {
      error.value = 'Failed to update card';
      console.error(err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteCard(id: number) {
    loading.value = true;
    error.value = null;
    try {
      await api.delete(`/cards/${id}`);
      cards.value = cards.value.filter((c) => c.id !== id);
      if (currentCard.value?.id === id) {
        currentCard.value = null;
      }
    } catch (err) {
      error.value = 'Failed to delete card';
      console.error(err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteComment(cardId: number, commentId: number) {
    error.value = null;
    try {
      await api.delete(`/cards/${cardId}/comments/${commentId}`);
      if (currentCard.value?.id === cardId) {
        currentCard.value.comments = currentCard.value.comments.filter((c) => c.id !== commentId);
      }
    } catch (err) {
      error.value = 'Failed to delete comment';
      console.error(err);
      throw err;
    }
  }

  function clearCurrentCard() {
    currentCard.value = null;
  }

  const cardsByStatus = computed(() => {
    const todo = cards.value.filter((c) => c.status === 'todo');
    const inProgress = cards.value.filter((c) => c.status === 'in_progress');
    const done = cards.value.filter((c) => c.status === 'done');
    return { todo, in_progress: inProgress, done };
  });

  return {
    cards,
    currentCard,
    loading,
    error,
    cardsByStatus,
    fetchCards,
    fetchCard,
    createCard,
    updateCard,
    deleteCard,
    deleteComment,
    clearCurrentCard,
  };
});
