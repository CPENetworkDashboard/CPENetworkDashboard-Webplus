<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import DownloadActions from '@/components/DownloadActions.vue'
import SiteIcon from '@/components/SiteIcon.vue'
import { downloads } from '@/content'
import { useAnalytics } from '@/composables/useAnalytics'
import { useDownloads } from '@/composables/useDownloads'
import { platformAdviceMap } from '@/utils/platform'

const { analyticsState, statForDownload, downloadVersionTotals, totalDownloads, valueOrPreview } =
  useAnalytics()
const {
  copiedChecksum,
  copyChecksum,
  detectedPlatform,
  downloadButtonText,
  downloadChunkedFile,
  downloadStatusText,
  getDownloadState,
  handleDownload,
  initDownloadRecommendation,
  isDownloadBusy,
  platformAdvice,
  recommendedDownload,
  selectDownload,
} = useDownloads()

const allFiles = '所有文件'
const filters = [...new Set(downloads.map((file) => file.platform)), allFiles]
const activeFilter = ref(allFiles)
const defaultIds = new Set(Object.values(platformAdviceMap).map((advice) => advice.primaryId))
const packageTypes: Record<string, { name: string; note?: string }> = {
  APK: { name: '安装包' },
  DMG: { name: '桌面版', note: '适用于配备 Apple 芯片的 Mac（arm64）。' },
  EXE: { name: '常规安装', note: '适用于 64 位 Windows。运行安装程序，按提示完成安装。' },
  ZIP: { name: '免安装版', note: '适用于 64 位 Windows。完整解压后即可运行。' },
  MSI: { name: '批量部署', note: '供管理员在多台 64 位 Windows 电脑上统一安装。' },
}
const packages = downloads.map((file) => {
  const format = file.fileName.split('.').pop()?.toUpperCase() || ''
  const type = packageTypes[format]
  const name = file.label.startsWith('旧版') ? '旧版回退包' : type?.name
  return {
    file,
    format,
    title: name ? file.platform + ' ' + name : file.title,
    note: type?.note ?? file.copy,
  }
})
const visiblePackages = computed(() => {
  if (activeFilter.value === allFiles) return packages
  const matches = packages.filter(({ file }) => file.platform === activeFilter.value)
  const first = matches.find(({ file }) => file.id === recommendedDownload.value.id)
  return first ? [first, ...matches.filter((item) => item !== first)] : matches
})
const supportedDevice = computed(() =>
  ['android', 'macos', 'windows'].includes(detectedPlatform.value)
)
const deviceNote = computed(() => {
  if (supportedDevice.value)
    return `已识别为 ${platformAdvice.value.device}，也可为其他设备下载安装包。`
  if (detectedPlatform.value === 'ios') return 'iPhone 和 iPad 暂无安装包。可在下方为其他设备下载。'
  if (detectedPlatform.value === 'linux') return 'Linux 暂无安装包。可在下方为其他设备下载。'
  return '请选择要安装应用的设备系统。'
})
function filterBy(platform: string) {
  activeFilter.value = platform
  const primary = downloads.find((file) => file.platform === platform && defaultIds.has(file.id))
  if (primary) selectDownload(primary.id)
}

const route = useRoute()
function applyRequestedDownload() {
  const requested = downloads.find((file) => file.id === route.query.file)
  if (requested) {
    selectDownload(requested.id)
    activeFilter.value = requested.platform
  } else if (supportedDevice.value) {
    selectDownload(platformAdvice.value.primaryId)
    activeFilter.value = recommendedDownload.value.platform
  } else {
    activeFilter.value = allFiles
  }
}
onMounted(() => {
  initDownloadRecommendation()
  applyRequestedDownload()
})
watch(() => route.query.file, applyRequestedDownload)

const versionRows = computed(() =>
  Object.values(downloadVersionTotals.value).filter(
    (row) => row.platform.toLowerCase() !== 'legacy'
  )
)
</script>

<template>
  <section class="content-width sp-page" aria-labelledby="download-title">
    <header class="sp-header">
      <div>
        <h1 id="download-title">下载 CPE加加</h1>
        <p>{{ deviceNote }}</p>
      </div>
      <nav class="sp-links" aria-label="下载相关信息">
        <RouterLink to="/changelog">更新日志</RouterLink>
        <RouterLink to="/status">服务状态</RouterLink>
      </nav>
    </header>

    <div class="sp-filters" role="group" aria-label="按设备系统筛选安装包">
      <button
        v-for="filter in filters"
        :key="filter"
        type="button"
        :aria-pressed="activeFilter === filter"
        aria-controls="package-list"
        @click="filterBy(filter)"
      >
        {{ filter }}
      </button>
    </div>
    <p class="sr-only" role="status">{{ activeFilter }}，共 {{ visiblePackages.length }} 个文件</p>
    <ul id="package-list" class="sp-packages" aria-label="安装包">
      <li
        v-for="{ file, format, title, note } in visiblePackages"
        :key="file.id"
        class="sp-package"
      >
        <span class="sp-format">{{ format }}</span>
        <div class="sp-package-info">
          <div class="sp-package-title">
            <h2>{{ title }}</h2>
            <small v-if="file.beta">测试版</small>
            <small v-else-if="supportedDevice && file.id === platformAdvice.primaryId"
              >当前设备推荐</small
            >
          </div>
          <p>{{ note }}</p>
          <p v-if="file.beta">测试版可能不稳定，日常使用建议选择正式版。</p>
          <div class="sp-meta">
            <span>v{{ file.version }}</span>
            <span>{{ file.size }}</span>
            <span v-if="totalDownloads !== null">{{ statForDownload(file.id) }}</span>
          </div>
        </div>
        <DownloadActions
          role="group"
          :aria-label="`${file.title} 下载与校验`"
          :download="file"
          :button-text="
            getDownloadState(file.id).status ? downloadButtonText(file) : `下载 ${format}`
          "
          :busy="isDownloadBusy(file.id)"
          :copied="copiedChecksum === file.id"
          :state="getDownloadState(file.id)"
          :progress-text="
            getDownloadState(file.id).status === 'error'
              ? '下载中断，重试将从头下载。'
              : downloadStatusText(file)
          "
          @direct="handleDownload"
          @chunked="downloadChunkedFile"
          @checksum="copyChecksum"
        />
      </li>
    </ul>
    <div class="sp-download-note">
      <p>分片安装包由浏览器自动合并，请在保存完成前保持页面打开。</p>
      <a class="sp-link" href="/downloads/checksums.txt" target="_blank" rel="noopener noreferrer"
        >查看 SHA-256 校验清单</a
      >
    </div>

    <details class="sp-counts">
      <summary>
        <span>下载统计</span>
        <small v-if="totalDownloads !== null">累计 {{ valueOrPreview(totalDownloads) }} 次</small>
        <small v-else>{{ analyticsState === 'offline' ? '暂不可用' : '加载中…' }}</small>
        <SiteIcon class="sp-chevron" name="chevron" :size="18" />
      </summary>
      <template v-if="totalDownloads !== null">
        <p>按下载点击计数，同一平台和版本的不同文件合并统计。</p>
        <dl class="sp-stats-list">
          <div v-for="row in versionRows" :key="row.id">
            <dt>{{ row.label }}</dt>
            <dd>{{ valueOrPreview(row.total) }} 次</dd>
          </div>
        </dl>
      </template>
      <p v-else>统计数据{{ analyticsState === 'offline' ? '暂时无法读取。' : '正在加载。' }}</p>
    </details>
  </section>
</template>

<style src="../styles/support-pages.css"></style>
