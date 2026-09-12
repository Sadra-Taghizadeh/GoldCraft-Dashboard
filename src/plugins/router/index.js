import { createRouter, createWebHistory } from 'vue-router'
import { setRole } from '@/composables/useAuth'
import { routes } from './routes'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to) => {
  setRole('admin')

  if (to.meta?.public && to.path === '/login') {
    return { path: '/dashboard' }
  }

  return true
})

export default function (app) {
  app.use(router)
}
export { router }
