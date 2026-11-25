<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import SiteIcon from '@/components/SiteIcon.vue'
import WifiChannelPreview from '@/components/WifiChannelPreview.vue'
import AndroidApp from '@/components/AndroidApp.vue'
import { androidFeature, type AndroidView } from '@/androidTour'
import { downloads, supportedDevices } from '@/content'
import { useProductMotion } from '@/composables/useProductMotion'

const page = ref<HTMLElement | null>(null)
useProductMotion(page)
const liveView = ref<AndroidView>('connect')
const carrier = ref<'primary' | 'secondary'>('primary')
const panels = [
  {
    id: 'neighbors',
    title: '比较同频邻区',
    copy: '在连接页查看 PCI、频点和信号强度，点选邻区可确认锁小区。',
    icon: 'signal',
  },
  {
    id: 'lock',
    title: '调整驻留频段',
    copy: '分别为主小区和辅小区选择 LTE、NR 频段，应用后查看配置。',
    icon: 'sliders',
  },
  {
    id: 'speed',
    title: '验证上下行速率',
    copy: '回放 30 秒的双向测速，查看瞬时速率、平滑峰值和用量。',
    icon: 'activity',
  },
] as const
const downloadsForPlatform = ['Android', 'macOS', 'Windows'].map((name) => ({
  name,
  icon: name === 'macOS' ? 'apple' : name.toLowerCase(),
  file: downloads.find(
    (item) => item.platform === name && (name !== 'Windows' || item.id.startsWith('windows-exe-'))
  )!,
}))
const productView = (view: AndroidView) => ({ path: '/product', query: { view } })
</script>

<template>
  <div ref="page" class="overview">
    <section class="launchpad" aria-labelledby="home-title">
      <div class="launch-layout content-width">
        <div class="launch-copy">
          <p class="launch-brand">CPE加加 <span>/</span> CPE++</p>
          <h1 id="home-title">看清信号，<br />再调频段。</h1>
          <p class="launch-description">
            在手机和桌面上查看 4G / 5G 小区与射频质量，选择驻留频段，再用双向测速验证调整后的链路。
          </p>
          <div class="launch-actions">
            <RouterLink class="launch-download" to="/download"
              ><SiteIcon name="download" :size="18" />下载 CPE加加</RouterLink
            ><RouterLink class="launch-tour" to="/product">探索产品功能</RouterLink>
          </div>
          <p class="launch-platforms">Android <i></i> macOS <i></i> Windows</p>
        </div>
        <figure class="radio-stage">
          <div class="radio-field" aria-hidden="true"></div>
          <div v-if="liveView === 'connect'" class="carrier-readout" aria-hidden="true">
            <span>当前载波</span><b>{{ carrier === 'primary' ? 'N41' : 'N78' }}</b
            ><small>{{ carrier === 'primary' ? 'NR PCC' : 'NR SCC 1' }}</small
            ><i></i>
          </div>
          <AndroidApp :view="liveView" @select="liveView = $event" @carrier="carrier = $event" />
          <figcaption>
            Android · {{ androidFeature(liveView).label }} <span>示例数据</span>
          </figcaption>
        </figure>
      </div>
    </section>
    <div class="vendor-strip content-width">
      <span>适配设备厂商</span>
      <ul>
        <li v-for="[vendor] in supportedDevices" :key="vendor">{{ vendor.split(' / ')[1] }}</li>
      </ul>
      <RouterLink :to="{ path: '/product', hash: '#devices' }">查询机型</RouterLink>
    </div>
    <section class="overview-section content-width" aria-labelledby="tour-title">
      <header class="section-intro" data-reveal>
        <div>
          <p class="section-kicker">Android</p>
          <h2 id="tour-title">从信号观察到链路验证</h2>
        </div>
        <RouterLink class="plain-link" to="/product">完整界面导览</RouterLink>
      </header>
      <div class="feature-prints">
        <RouterLink
          v-for="panel in panels"
          :key="panel.id"
          class="feature-print"
          :to="productView(panel.id)"
          data-reveal
        >
          <div class="print-icon"><SiteIcon :name="panel.icon" :size="24" /></div>
          <h3>{{ panel.title }}</h3>
          <p>{{ panel.copy }}</p>
        </RouterLink>
      </div>
    </section>
    <section class="desktop-spread content-width" aria-labelledby="desk-title" data-reveal>
      <div>
        <p class="section-kicker">Wi-Fi 信道</p>
        <h2 id="desk-title">看看附近的<br />无线网络</h2>
        <p>同一信道上可能有多个热点。切换频段，观察曲线重叠的位置，比较接收到的信号强度。</p>
        <RouterLink class="plain-link" :to="productView('wifi')">在测试页中打开</RouterLink>
      </div>
      <div class="spectrum-feature"><WifiChannelPreview /></div>
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
