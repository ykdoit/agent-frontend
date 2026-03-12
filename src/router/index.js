/**
 * 路由配置
 */
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/Home.vue'),
    meta: { title: '智能办公助手' }
  },
  {
    path: '/chat/:id?',
    name: 'chat',
    component: () => import('@/views/Chat.vue'),
    meta: { title: '对话' }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

/**
 * 路由守卫 - 更新页面标题
 */
router.beforeEach((to, from, next) => {
  document.title = to.meta.title || '智能办公助手'
  next()
})

export default router
