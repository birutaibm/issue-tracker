<script setup lang="ts">
import { ref } from 'vue';
import { useCardsStore } from '@/stores/cards';
import type { CommentWithContent } from '@shared/types';

interface Props {
  cardId: number;
  comments: CommentWithContent[];
}

const props = defineProps<Props>();
const cardsStore = useCardsStore();

const newComment = ref('');
const adding = ref(false);

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function handleAddComment() {
  if (!newComment.value.trim()) return;

  adding.value = true;
  try {
    const api = (await import('@/api/client')).default;
    await api.post<CommentWithContent>(`/cards/${props.cardId}/comments`, {
      content: newComment.value.trim(),
    });
    newComment.value = '';
    if (cardsStore.currentCard?.id === props.cardId) {
      cardsStore.fetchCard(props.cardId);
    }
  } catch (err) {
    console.error('Failed to add comment:', err);
  } finally {
    adding.value = false;
  }
}
</script>

<template>
  <div class="comment-list">
    <h3>Comments ({{ props.comments.length }})</h3>

    <div class="comments" v-if="props.comments.length > 0">
      <div class="comment" v-for="comment in props.comments" :key="comment.id">
        <div class="comment-header">
          <span class="comment-date">{{ formatDate(comment.created_at) }}</span>
        </div>
        <div class="comment-content" v-html="comment.content"></div>
      </div>
    </div>

    <p v-else class="no-comments">No comments yet.</p>

    <div class="add-comment">
      <textarea
        v-model="newComment"
        placeholder="Add a comment (Markdown supported)..."
        rows="3"
        @keydown.ctrl.enter="handleAddComment"
        @keydown.meta.enter="handleAddComment"
      ></textarea>
      <button
        class="btn btn-primary"
        @click="handleAddComment"
        :disabled="adding || !newComment.trim()"
      >
        {{ adding ? 'Adding...' : 'Add Comment' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.comment-list {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e0e0e0;
}

.comment-list h3 {
  margin: 0 0 1rem 0;
  color: #333;
}

.comments {
  margin-bottom: 1.5rem;
}

.comment {
  background: #fafafa;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 0.75rem;
  border: 1px solid #e0e0e0;
}

.comment-header {
  margin-bottom: 0.5rem;
}

.comment-date {
  font-size: 0.75rem;
  color: #999;
}

.comment-content {
  line-height: 1.6;
}

.comment-content code {
  background: #e0e0e0;
  padding: 0.125rem 0.25rem;
  border-radius: 3px;
  font-size: 0.875em;
}

.comment-content pre {
  background: #2d2d2d;
  color: #f8f8f2;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  margin: 0.5rem 0;
}

.comment-content pre code {
  background: none;
  padding: 0;
  color: inherit;
}

.no-comments {
  color: #999;
  font-style: italic;
  margin: 1rem 0;
}

.add-comment {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.add-comment textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
  font-size: 0.875rem;
  resize: vertical;
  box-sizing: border-box;
}

.add-comment textarea:focus {
  outline: none;
  border-color: #42b883;
  box-shadow: 0 0 0 2px rgba(66, 184, 131, 0.2);
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background-color 0.2s;
  align-self: flex-start;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #42b883;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #36a070;
}
</style>
