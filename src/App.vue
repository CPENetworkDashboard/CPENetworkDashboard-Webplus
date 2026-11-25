<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import { onMounted, ref, watch } from 'vue'
import SiteFooter from '@/components/SiteFooter.vue'
import SiteHeader from '@/components/SiteHeader.vue'
import { useAnalytics } from '@/composables/useAnalytics'

const route = useRoute()
const { loadSummary, recordVisit } = useAnalytics()

const privacyStorageKey = 'cpe-plus-plus-privacy-notice-v1'
const privacyNoticeVisible = ref(false)
const trackingAllowed = ref(false)
function focusMain() {
  document.getElementById('main-content')?.focus()
}

async function refreshPublicStats(): Promise<void> {
  await loadSummary()
}

async function maybeRecordVisit(path: string): Promise<void> {
  if (trackingAllowed.value) {
    await recordVisit(path)
    return
  }
  await refreshPublicStats()
}

async function saveNotice(allow: boolean): Promise<void> {
  try {
    localStorage.setItem(privacyStorageKey, allow ? 'accepted' : 'declined')
  } catch {
    /* Consent applies to this session. */
  }
  privacyNoticeVisible.value = false
  trackingAllowed.value = allow
  if (allow) await recordVisit(route.path)
}

watch(
  () => route.path,
  async (path) => {
    document.title = `${String(route.meta.title || 'CPE加加')} / CPE++`
    await maybeRecordVisit(path)
  }
)

onMounted(async () => {
  document.title = `${String(route.meta.title || 'CPE加加')} / CPE++`
  let choice: string | null = null
  try {
    choice = localStorage.getItem(privacyStorageKey)
  } catch {
    /* Show the notice. */
  }
  trackingAllowed.value = choice === 'accepted'
  privacyNoticeVisible.value = choice !== 'accepted' && choice !== 'declined'
  await maybeRecordVisit(route.path)
})
</script>

<template>
  <div class="site-shell">
    <a class="skip-link" href="#main-content" @click.prevent="focusMain">跳转到主要内容</a>
    <SiteHeader />
    <main id="main-content" tabindex="-1">
      <RouterView />
    </main>
    <SiteFooter />
    <div v-if="privacyNoticeVisible" class="privacy-notice" role="region" aria-label="访问统计偏好">
      <div>
        <strong>访问统计</strong>
        <p>
          允许记录访问页面、来源、系统、浏览器和粗略地区，用于了解官网使用情况。安装包下载量单独统计。
        </p>
      </div>
      <div class="notice-actions">
        <button type="button" @click="saveNotice(false)">仅浏览</button
        ><button type="button" @click="saveNotice(true)">允许统计</button>
      </div>
    </div>
  </div>
</template>
