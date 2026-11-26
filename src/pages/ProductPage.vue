<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AndroidShowcase from '@/components/AndroidShowcase.vue'
import SiteIcon from '@/components/SiteIcon.vue'
import { supportedDevices } from '@/content'
const search = ref('')
const filteredDevices = computed(() =>
  supportedDevices.filter((row) =>
    row.join(' ').toLowerCase().includes(search.value.trim().toLowerCase())
  )
)
</script>

<template>
  <div class="guide-backdrop">
    <div class="product-guide-head">
      <header class="product-guide-intro content-width">
        <h1>产品功能</h1>
        <nav class="guide-index" aria-label="产品目录">
          <RouterLink :to="{ path: '/product', hash: '#mobile' }">Android</RouterLink>
          <RouterLink :to="{ path: '/product', hash: '#desktop' }">桌面端</RouterLink>
          <RouterLink :to="{ path: '/product', hash: '#devices' }">设备兼容性</RouterLink>
        </nav>
      </header>
    </div>
    <AndroidShowcase />
    <div class="product-guide content-width film-after">
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
