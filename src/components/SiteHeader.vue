<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import SiteIcon from '@/components/SiteIcon.vue'
import { appIcon, routes } from '@/content'

type ThemeMode = 'light' | 'dark'

const theme = ref<ThemeMode>('light')
const isDark = computed(() => theme.value === 'dark')
const menuOpen = ref(false)
const route = useRoute()
const showcase = computed(() => route.path === '/' || route.path === '/product')
const header = ref<HTMLElement>()
const menuToggle = ref<HTMLButtonElement>()
function closeMenu() {
  if (!menuOpen.value) return
  menuOpen.value = false
  menuToggle.value?.focus()
}
function dismissOutside(event: PointerEvent) {
  if (event.target instanceof Node && !header.value?.contains(event.target)) menuOpen.value = false
}
watch(menuOpen, (open) => {
  if (open) document.addEventListener('pointerdown', dismissOutside)
  else document.removeEventListener('pointerdown', dismissOutside)
})
onUnmounted(() => document.removeEventListener('pointerdown', dismissOutside))
watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false
  }
)

function preferredTheme(): ThemeMode {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function updateThemeColor() {
  const color = showcase.value ? '#131f2d' : isDark.value ? '#0c0e14' : '#f5f7fb'
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color)
}

watch(showcase, updateThemeColor)

function applyTheme(nextTheme: ThemeMode): void {
  theme.value = nextTheme
  document.documentElement.dataset.theme = nextTheme
  updateThemeColor()
  try {
    localStorage.setItem('cpe-theme', nextTheme)
  } catch {
    /* Theme still works without storage. */
  }
}

function toggleTheme(): void {
  applyTheme(isDark.value ? 'light' : 'dark')
}

onMounted(() => {
  const existing = document.documentElement.dataset.theme
  let saved: string | null = null
  try {
    saved = localStorage.getItem('cpe-theme')
  } catch {
    /* Follow the initial theme. */
  }
  const nextTheme =
    existing === 'dark' || existing === 'light'
      ? existing
      : saved === 'dark' || saved === 'light'
        ? saved
        : preferredTheme()
  applyTheme(nextTheme)
})
</script>

<template>
  <header
    ref="header"
    class="topbar"
    :class="{ 'showcase-topbar': showcase }"
    @keydown.esc="closeMenu"
  >
    <RouterLink class="brand-lockup" to="/" aria-label="CPE加加首页">
      <img :src="appIcon" alt="" width="36" height="36" loading="eager" decoding="async" />
      <span>
        <strong>CPE加加</strong>
        <small>CPE++</small>
      </span>
    </RouterLink>
    <div class="topbar-actions">
      <nav
        id="main-navigation"
        class="nav-links"
        :class="{ 'is-open': menuOpen }"
        aria-label="主导航"
      >
        <RouterLink
          v-for="navItem in routes"
          :key="navItem.path"
          :to="navItem.path"
          :class="{ active: $route.path === navItem.path }"
          :aria-current="$route.path === navItem.path ? 'page' : undefined"
        >
          {{ navItem.label }}
        </RouterLink>
      </nav>
      <button
        class="theme-toggle"
        :class="{ 'is-dark': isDark }"
        type="button"
        :aria-label="isDark ? '切换到亮色模式' : '切换到深色模式'"
        :aria-pressed="isDark"
        @click="toggleTheme"
      >
        <svg class="sun-icon" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path
            d="M12 2.8v2.4M12 18.8v2.4M4.3 4.3 6 6M18 18l1.7 1.7M2.8 12h2.4M18.8 12h2.4M4.3 19.7 6 18M18 6l1.7-1.7"
          />
        </svg>
        <svg class="moon-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20.2 14.4A7.6 7.6 0 0 1 9.6 3.8 8.4 8.4 0 1 0 20.2 14.4Z" />
        </svg>
      </button>
      <button
        ref="menuToggle"
        class="mobile-menu-toggle"
        type="button"
        aria-controls="main-navigation"
        :aria-expanded="menuOpen"
        :aria-label="menuOpen ? '关闭导航' : '打开导航'"
        @click="menuOpen = !menuOpen"
      >
        <SiteIcon :name="menuOpen ? 'close' : 'menu'" />
      </button>
    </div>
  </header>
</template>
