import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUIStore = defineStore('ui', () => {
  const modals = ref<Record<string, boolean>>({});
  const loadingStates = ref<Record<string, boolean>>({});

  function openModal(name: string) {
    modals.value[name] = true;
  }

  function closeModal(name: string) {
    modals.value[name] = false;
  }

  function toggleModal(name: string) {
    modals.value[name] = !modals.value[name];
  }

  function isModalOpen(name: string): boolean {
    return !!modals.value[name];
  }

  function setLoading(key: string, value: boolean) {
    loadingStates.value[key] = value;
  }

  function isLoading(key: string): boolean {
    return !!loadingStates.value[key];
  }

  return {
    modals,
    loadingStates,
    openModal,
    closeModal,
    toggleModal,
    isModalOpen,
    setLoading,
    isLoading,
  };
});
