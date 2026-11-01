<script setup lang="ts">
import { ref } from 'vue';
import { useProjectsStore } from '@/stores/projects';
import type { CreateProjectInput, UpdateProjectInput } from '@shared/types';

interface Props {
  project?: {
    id: number;
    title: string;
  };
}

interface Emits {
  close: [];
  saved: [];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const projectsStore = useProjectsStore();
const title = ref('');
const loading = ref(false);
const error = ref<string | null>(null);

const isEditing = !!props.project;

if (isEditing && props.project) {
  title.value = props.project.title;
}

async function handleSubmit() {
  if (!title.value.trim()) {
    error.value = 'Title is required';
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    if (isEditing && props.project) {
      await projectsStore.updateProject(props.project.id, { title: title.value.trim() });
    } else {
      await projectsStore.createProject({ title: title.value.trim() });
    }
    emit('saved');
  } catch {
    error.value = isEditing ? 'Failed to update project' : 'Failed to create project';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="modal-overlay" @click="emit('close')">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h3>{{ isEditing ? 'Edit Project' : 'Create Project' }}</h3>
        <button class="modal-close" @click="emit('close')">×</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label for="title">Title</label>
          <input
            id="title"
            v-model="title"
            type="text"
            placeholder="Enter project title"
            @keyup.enter="handleSubmit"
            :disabled="loading"
          />
        </div>
        <p v-if="error" class="error">{{ error }}</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="emit('close')" :disabled="loading">Cancel</button>
        <button class="btn btn-primary" @click="handleSubmit" :disabled="loading">
          {{ loading ? 'Saving...' : isEditing ? 'Save' : 'Create' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.modal-header h3 {
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
  line-height: 1;
}

.modal-close:hover {
  color: #333;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #42b883;
  box-shadow: 0 0 0 2px rgba(66, 184, 131, 0.2);
}

.error {
  color: #d32f2f;
  font-size: 0.875rem;
  margin: 0.5rem 0 0 0;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.5rem;
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

.btn-secondary {
  background: #e0e0e0;
  color: #333;
}

.btn-secondary:hover:not(:disabled) {
  background: #d0d0d0;
}
</style>
