<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AndroidShowcase from '@/components/AndroidShowcase.vue'
import ProductExplorer from '@/components/ProductExplorer.vue'
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
  <section class="page-view product-experience content-width">
    <header class="experience-heading">
      <p>产品功能</p>
      <h1>面向 CPE 的<br />网络管理与诊断。</h1>
      <span
        >集成网络状态监测、频段管理与链路测试。<br />为桌面排障与移动巡检提供统一的操作流程。</span
      >
    </header>
    <section class="product-story" aria-labelledby="desktop-title">
      <div class="landing-section-heading">
        <div>
          <p>macOS / Windows</p>
          <h2 id="desktop-title">桌面端网络管理</h2>
        </div>
        <p>连接看板、锁定回读、链路测试。<br />选择下方功能，查看实际应用界面。</p>
      </div>
      <ProductExplorer />
    </section>
    <section id="mobile" class="product-story" aria-labelledby="mobile-title">
      <div class="landing-section-heading">
        <div>
          <p>Android</p>
          <h2 id="mobile-title">Android 现场调试</h2>
        </div>
        <p>在移动端查看连接状态、配置频段，<br />并完成现场网络测试。</p>
      </div>
      <AndroidShowcase />
    </section>
    <section id="devices" class="device-directory" aria-labelledby="devices-title">
      <div class="landing-section-heading">
        <div>
          <h2 id="devices-title">设备兼容性</h2>
          <p>按设备族分别适配。具体能力取决于机型和固件。</p>
        </div>
        <label class="device-search"
          ><SiteIcon name="search" :size="18" /><span class="sr-only">搜索厂商或设备型号</span
          ><input
            v-model="search"
            type="search"
            name="device-search"
            placeholder="搜索厂商或型号…"
            autocomplete="off"
        /></label>
      </div>
      <div class="device-directory-table">
        <div v-for="[brand, models] in filteredDevices" :key="brand">
          <strong>{{ brand }}</strong>
          <p>{{ models }}</p>
        </div>
        <p v-if="!filteredDevices.length" class="device-no-results" role="status">
          没有找到匹配机型。试试厂商名称，或到关于页面联系开发者。
        </p>
      </div>
    </section>
    <section class="product-endnote">
      <h2>下载 CPE加加，开始设备管理。</h2>
      <RouterLink class="action primary" to="/download"
        ><SiteIcon name="download" :size="18" />下载 CPE加加</RouterLink
      >
    </section>
  </section>
</template>
