<script setup lang="ts">
import { RouterLink } from 'vue-router'
import SiteIcon from '@/components/SiteIcon.vue'
import AndroidShowcase from '@/components/AndroidShowcase.vue'
import { downloads, supportedDevices } from '@/content'

const downloadsForPlatform = ['Android', 'macOS', 'Windows'].map((name) => ({
  name,
  icon: name === 'macOS' ? 'apple' : name.toLowerCase(),
  file: downloads.find(
    (item) => item.platform === name && (name !== 'Windows' || item.id.startsWith('windows-exe-'))
  )!,
}))
</script>

<template>
  <div class="overview">
    <AndroidShowcase home />
    <section class="vendor-strip content-width" aria-labelledby="vendors-title">
      <h2 id="vendors-title">适配设备厂商</h2>
      <ul>
        <li v-for="[vendor] in supportedDevices" :key="vendor">{{ vendor.split(' / ')[1] }}</li>
      </ul>
      <RouterLink :to="{ path: '/product', hash: '#devices' }">查询机型</RouterLink>
    </section>
    <section class="platform-shelf content-width" aria-labelledby="get-title">
      <header>
        <h2 id="get-title">获取 CPE加加</h2>
        <RouterLink class="plain-link" to="/changelog">更新日志</RouterLink>
      </header>
      <div>
        <RouterLink
          v-for="platform in downloadsForPlatform"
          :key="platform.name"
          :to="{ path: '/download', query: { file: platform.file.id } }"
          ><SiteIcon :name="platform.icon" :size="22" /><strong>{{ platform.name }}</strong
          ><span>v{{ platform.file.version }}</span
          ><SiteIcon name="download" :size="17"
        /></RouterLink>
      </div>
    </section>
  </div>
</template>
