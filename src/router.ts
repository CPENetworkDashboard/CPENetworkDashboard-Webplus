import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/pages/HomePage.vue'),
    meta: { title: 'CPE加加' },
  },
  {
    path: '/product',
    name: 'product',
    component: () => import('@/pages/ProductPage.vue'),
    meta: { title: '产品介绍' },
  },
  {
    path: '/download',
    name: 'download',
    component: () => import('@/pages/DownloadPage.vue'),
    meta: { title: '下载 CPE加加' },
  },
  {
    path: '/changelog',
    name: 'changelog',
    component: () => import('@/pages/ChangelogPage.vue'),
    meta: { title: '更新日志' },
  },
  {
    path: '/status',
    name: 'status',
    component: () => import('@/pages/StatusPage.vue'),
    meta: { title: '服务状态' },
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('@/pages/AboutPage.vue'),
    meta: { title: '关于 CPE加加' },
  },
  {
    path: '/analytics',
    name: 'analytics',
    component: () => import('@/pages/AnalyticsPage.vue'),
    meta: { title: '访问统计' },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    // A new preview or download selection should keep the reader in place.
    if (to.path === from.path && to.hash === from.hash) return false
    if (to.hash) {
      const section = document.getElementById(to.hash.slice(1))
      if (section) return { el: section, top: 76, behavior: 'instant' }
    }
    return { top: 0, behavior: 'instant' }
  },
})
