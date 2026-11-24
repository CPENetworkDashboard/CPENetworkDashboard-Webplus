<script setup lang="ts">
import { RouterLink } from 'vue-router'
import SiteIcon from '@/components/SiteIcon.vue'
import { appIcon } from '@/content'
import { useAnalytics } from '@/composables/useAnalytics'
const { totalDownloads, totalVisits, valueOrPreview } = useAnalytics()
</script>

<template>
  <footer class="site-footer">
    <div class="site-footer-top">
      <div>
        <RouterLink class="site-footer-brand" to="/"
          ><img :src="appIcon" width="33" height="33" alt="" loading="lazy" />CPE加加
          <small>CPE++</small></RouterLink
        >
        <p>面向 4G / 5G CPE 的网络管理与诊断工具。</p>
      </div>
      <nav class="site-footer-links" aria-label="页脚导航">
        <div>
          <RouterLink to="/product">产品功能</RouterLink
          ><RouterLink to="/download">下载应用</RouterLink
          ><RouterLink to="/changelog">更新日志</RouterLink>
        </div>
        <div>
          <RouterLink to="/status"><SiteIcon name="activity" :size="15" />服务状态</RouterLink
          ><RouterLink to="/about">关于与支持</RouterLink
          ><a
            href="https://github.com/CPENetworkDashboard"
            target="_blank"
            rel="noopener noreferrer"
            ><SiteIcon name="github" :size="15" />GitHub</a
          >
        </div>
      </nav>
    </div>
    <div class="site-footer-bottom">
      <p>© 2026 yuan-666, chazime and contributors. All rights reserved.</p>
      <div class="site-footer-stats" aria-label="官网统计">
        <span>访问 {{ valueOrPreview(totalVisits) }}</span
        ><span>下载 {{ valueOrPreview(totalDownloads) }}</span>
      </div>
    </div>
    <div class="site-footer-icp">
      <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer"
        >湘ICP备2024065803号-3</a
      >
    </div>
  </footer>
</template>
