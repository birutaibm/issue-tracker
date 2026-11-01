import { createRouter, createWebHistory } from 'vue-router';
import ProjectList from '@/views/ProjectList.vue';
import ProjectDetail from '@/views/ProjectDetail.vue';
import CardDetail from '@/views/CardDetail.vue';

const routes = [
  { path: '/', component: ProjectList },
  { path: '/projects/:projectId', component: ProjectDetail, props: true },
  { path: '/projects/:projectId/cards/:cardId', component: CardDetail, props: true },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
