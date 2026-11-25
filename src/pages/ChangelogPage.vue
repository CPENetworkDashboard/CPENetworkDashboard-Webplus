<script setup lang="ts">
import { RouterLink } from 'vue-router'
import SiteIcon from '@/components/SiteIcon.vue'
import { changelogEntries, downloads } from '@/content'
import { platformAdviceMap } from '@/utils/platform'

const primaryIds = new Set(Object.values(platformAdviceMap).map((advice) => advice.primaryId))
const releases = changelogEntries.map((entry) => {
  const files = downloads.filter((file) => file.version === entry.version)
  const currentPlatforms = files
    .filter((file) => primaryIds.has(file.id))
    .map((file) => file.platform)
  return { entry, files, currentPlatforms }
})
</script>

<template>
  <section class="content-width sp-page" aria-labelledby="changelog-title">
    <header class="sp-header">
      <h1 id="changelog-title">更新日志</h1>
      <RouterLink class="sp-link" to="/download">前往下载页</RouterLink>
    </header>

    <div class="sp-releases">
      <details
        v-for="({ entry, files, currentPlatforms }, index) in releases"
        :key="entry.version"
        class="sp-release"
        :open="index === 0"
      >
        <summary>
          <h2>
            <time :datetime="entry.date">{{ entry.date }}</time>
            <span class="sp-release-version">{{ entry.version }}</span>
            <small v-if="currentPlatforms.length"
              >{{ currentPlatforms.join(' / ') }} 当前版本</small
            >
            <small v-else-if="files.length">{{ files[0].platform }} 旧版可下载</small>
            <small v-else>历史记录</small>
            <SiteIcon class="sp-chevron" name="chevron" :size="18" />
          </h2>
        </summary>
        <div class="sp-release-body">
          <p>{{ entry.lead }}</p>
          <section v-for="section in entry.sections" :key="section.title">
            <h3>{{ section.title }}</h3>
            <ul>
              <li v-for="item in section.items" :key="item">{{ item }}</li>
            </ul>
          </section>
          <nav v-if="files.length" class="sp-links" :aria-label="entry.version + ' 安装包'">
            <RouterLink
              v-for="file in files"
              :key="file.id"
              :to="{ path: '/download', query: { file: file.id } }"
              >下载 {{ file.platform }}
              {{ file.fileName.split('.').pop()?.toUpperCase() }}</RouterLink
            >
          </nav>
        </div>
      </details>
    </div>
  </section>
</template>

<style src="../styles/support-pages.css"></style>
