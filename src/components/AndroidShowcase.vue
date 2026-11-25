<script setup lang="ts">
import { computed, ref } from 'vue'
import SiteIcon from '@/components/SiteIcon.vue'
import ChapterLock from '@/components/story/ChapterLock.vue'
import ChapterTest from '@/components/story/ChapterTest.vue'
import ChapterTools from '@/components/story/ChapterTools.vue'
import FitBox from '@/components/story/FitBox.vue'
import PhoneConnect from '@/components/story/PhoneConnect.vue'
import PhoneMock from '@/components/story/PhoneMock.vue'
import PhoneNeighbors from '@/components/story/PhoneNeighbors.vue'
import { finalPower, finalRadio } from '@/components/story/data'

type PreviewId = 'connect' | 'neighbors' | 'lock' | 'speed' | 'wifi'

const previews: Array<{
  id: PreviewId
  label: string
  icon: string
  title: string
  copy: string
  points: string[]
}> = [
  {
    id: 'connect',
    label: '连接看板',
    icon: 'signal',
    title: '连接状态与射频质量，同屏呈现。',
    copy: '运营商、网络制式、当前小区与上下行链路集中排列。信号数值按客户端门限着色，现场判断更直接。',
    points: ['当前小区与载波聚合', 'RSRP / RSRQ / SINR', '上下行功率与链路信息'],
  },
  {
    id: 'neighbors',
    label: '设备与邻区',
    icon: 'phone',
    title: '设备统计和邻区，都按手机阅读。',
    copy: '设备型号、流量和连接时长保留清晰层级。邻区以条目展示频段、频点、PCI 与信号质量，点选后即可确认锁小区。',
    points: ['流量与连接时长统计', '卡片式邻区列表', '邻区快捷锁定'],
  },
  {
    id: 'lock',
    label: '锁频段',
    icon: 'sliders',
    title: '主小区与辅小区，分别选择。',
    copy: 'LTE 与 NR 频段按设备能力分组，Pcell+Scell 和 Scell 使用各自的选择状态。应用后再读取设备配置，核对实际结果。',
    points: ['Pcell+Scell / Scell', 'LTE / NR 四列频段网格', '应用与回读校验'],
  },
  {
    id: 'speed',
    label: '双向测速',
    icon: 'activity',
    title: '下载与上传，各自看清。',
    copy: '双向测试时，两张卡片独立记录实时速率、平均值、平滑峰值与累计流量。最近 30 秒曲线同步更新，波动更容易定位。',
    points: ['下载 / 上传独立曲线', '平均与平滑峰值', '最近 30 秒采样'],
  },
  {
    id: 'wifi',
    label: 'Wi-Fi 信道',
    icon: 'globe',
    title: '周边热点与信道占用，一屏查看。',
    copy: '2.4、5、6 GHz 分段查看热点分布，结合信道、Wi-Fi 标准和信号强度，为现场无线排查提供参考。',
    points: ['2.4 / 5 / 6 GHz', '信道占用曲线', '周边热点信号强度'],
  },
]

const active = ref<PreviewId>('connect')
const theme = ref<'dark' | 'light'>('dark')
const current = computed(() => previews.find((item) => item.id === active.value) ?? previews[0]!)
const page = computed<'connect' | 'lock' | 'test'>(() => {
  if (active.value === 'lock') return 'lock'
  if (active.value === 'speed' || active.value === 'wifi') return 'test'
  return 'connect'
})
const title = computed(() => {
  if (active.value === 'speed') return '测速'
  if (active.value === 'wifi') return 'Wi-Fi 信道'
  return ''
})

function select(id: PreviewId) {
  active.value = id
  theme.value = id === 'speed' ? 'light' : 'dark'
}
</script>

<template>
  <div class="android-showcase">
    <div class="android-preview-tabs" role="tablist" aria-label="Android 界面预览">
      <button
        v-for="item in previews"
        :key="item.id"
        type="button"
        role="tab"
        :data-preview="item.id"
        :aria-selected="active === item.id"
        :aria-controls="`android-panel-${item.id}`"
        @click="select(item.id)"
      >
        <SiteIcon :name="item.icon" :size="17" /><span>{{ item.label }}</span>
      </button>
    </div>
    <div
      :id="`android-panel-${active}`"
      class="android-preview-stage"
      role="tabpanel"
      :aria-label="current.label"
    >
      <div class="android-preview-device">
        <FitBox :width="410">
          <PhoneMock
            :page
            :theme
            :tabs="active === 'lock' ? ['网络首选', '锁频段', '锁频点', '锁小区'] : []"
            :tab="1"
            :title
          >
            <PhoneConnect v-if="active === 'connect'" :radio="finalRadio" :power="finalPower" />
            <PhoneNeighbors v-else-if="active === 'neighbors'" />
            <ChapterLock v-else-if="active === 'lock'" :t="1" mode="screen" />
            <ChapterTest v-else-if="active === 'speed'" :t="0.46" mode="screen" />
            <ChapterTools v-else :t="1" mode="screen" />
          </PhoneMock>
        </FitBox>
      </div>
      <div class="android-preview-copy">
        <p>ANDROID 界面预览</p>
        <h3>{{ current.title }}</h3>
        <span>{{ current.copy }}</span>
        <ul>
          <li v-for="point in current.points" :key="point">
            <SiteIcon name="check" :size="16" />{{ point }}
          </li>
        </ul>
        <footer>
          <span><i></i>演示数据</span>
          <button
            type="button"
            class="android-theme-switch"
            role="switch"
            :aria-checked="theme === 'dark'"
            :aria-label="theme === 'dark' ? '切换到浅色界面' : '切换到深色界面'"
            @click="theme = theme === 'dark' ? 'light' : 'dark'"
          >
            {{ theme === 'dark' ? '深色' : '浅色' }}<i><b></b></i>
          </button>
        </footer>
      </div>
    </div>
  </div>
</template>
