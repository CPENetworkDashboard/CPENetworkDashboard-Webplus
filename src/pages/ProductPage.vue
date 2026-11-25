<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import AndroidShowcase from '@/components/AndroidShowcase.vue'
import ProductExplorer from '@/components/ProductExplorer.vue'
import SiteIcon from '@/components/SiteIcon.vue'
import { supportedDevices } from '@/content'
import { androidFeature, type AndroidView } from '@/androidTour'

const route = useRoute(),
  router = useRouter()
const search = ref('')
const view = computed(() => androidFeature(route.query.view).id)
function chooseView(id: AndroidView) {
  if (view.value !== id)
    void router.replace({ path: '/product', query: { ...route.query, view: id }, hash: route.hash })
}
const filteredDevices = computed(() =>
  supportedDevices.filter((row) =>
    row.join(' ').toLowerCase().includes(search.value.trim().toLowerCase())
  )
)
</script>

<template>
  <div class="guide-backdrop">
    <div class="product-guide content-width">
      <header id="mobile" class="guide-header">
        <div>
          <p class="section-kicker">产品介绍</p>
          <h1>Android 界面导览</h1>
        </div>
        <nav class="guide-index" aria-label="产品介绍目录">
          <RouterLink :to="{ path: '/product', query: route.query, hash: '#desktop' }"
            >桌面端</RouterLink
          ><RouterLink :to="{ path: '/product', query: route.query, hash: '#devices' }"
            >设备兼容性</RouterLink
          >
        </nav>
      </header>
      <AndroidShowcase :view="view" @select="chooseView" />
      <section id="desktop" class="guide-section" aria-labelledby="desktop-title">
        <header class="section-intro">
          <div>
            <p class="section-kicker">macOS / Windows</p>
            <h2 id="desktop-title">在桌面上观察网络</h2>
          </div>
          <p>在大屏上核对射频指标、读取锁定配置，或追踪数据包经过的节点。</p>
        </header>
        <ProductExplorer />
      </section>
      <section id="devices" class="guide-section device-directory" aria-labelledby="devices-title">
        <div class="section-intro">
          <div>
            <p class="section-kicker">设备兼容性</p>
            <h2 id="devices-title">查找你的 CPE</h2>
            <p>锁频、锁小区等功能取决于具体机型和固件。</p>
          </div>
          <label class="device-search"
            ><SiteIcon name="search" :size="18" /><span class="sr-only">搜索厂商或型号</span
            ><input
              v-model="search"
              type="search"
              name="device-search"
              placeholder="搜索厂商或型号"
              autocomplete="off"
          /></label>
        </div>
        <div class="device-directory-table">
          <div v-for="[brand, models] in filteredDevices" :key="brand">
            <strong>{{ brand }}</strong>
            <p>{{ models }}</p>
          </div>
          <p v-if="!filteredDevices.length" class="device-no-results" role="status">
            未找到匹配机型。试试厂商名称，或到<RouterLink to="/about">关于页面</RouterLink
            >联系开发者。
          </p>
        </div>
      </section>
      <div class="guide-get">
        <p>Android、macOS 和 Windows 安装包</p>
        <RouterLink class="action primary" to="/download"
          ><SiteIcon name="download" :size="18" />下载 CPE加加</RouterLink
        >
      </div>
    </div>
  </div>
</template>
