import { createRouter, createWebHistory } from 'vue-router'
import CharacterList from '@/views/CharacterList.vue'
import CharacterDetail from '@/views/CharacterDetail.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'character-list',
      component: CharacterList
    },
    {
      path: '/character/:id',
      name: 'character-detail',
      component: CharacterDetail,
      props: true
    },
  ],
})

export default router