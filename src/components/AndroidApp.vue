<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, ref, watch } from 'vue'
import SiteIcon from './SiteIcon.vue'
import AndroidConnection from './AndroidConnection.vue'
import { androidFeature, type AndroidView, type CellTarget } from '@/androidTour'

const LockPanel = defineAsyncComponent(() => import('./AndroidLockPanel.vue'))
const Neighbors = defineAsyncComponent(() => import('./story/PhoneNeighbors.vue'))
const SpeedPanel = defineAsyncComponent(() => import('./AndroidSpeedPanel.vue'))
const WifiPreview = defineAsyncComponent(() => import('./WifiChannelPreview.vue'))
const props = defineProps<{ view: AndroidView }>()
const emit = defineEmits<{
  select: [view: AndroidView]
  carrier: [value: 'primary' | 'secondary']
}>()
const appearance = ref<'dark' | 'light' | null>(null)
const theme = computed(() => appearance.value ?? (props.view === 'speed' ? 'light' : 'dark'))
const border = ref(false)
const target = ref<CellTarget>()
const scroll = ref<HTMLElement>()
const dock = [
  { id: 'connect', label: '连接', icon: 'home' },
  { id: 'lock', label: '锁频', icon: 'lock' },
  { id: 'tests', label: '测试', icon: 'timer' },
  { id: 'settings', label: '设置', icon: 'settings' },
] as const
const activeNav = computed(() =>
  props.view === 'neighbors'
    ? 'connect'
    : ['speed', 'wifi'].includes(props.view)
      ? 'tests'
      : props.view
)
const subpage = computed(() => props.view === 'speed' || props.view === 'wifi')
watch(
  () => props.view,
  async () => {
    await nextTick()
    if (scroll.value) scroll.value.scrollTop = 0
  }
)
function lockCell(cell: CellTarget) {
  target.value = cell
  emit('select', 'lock')
}
</script>

<template>
  <div
    class="android-app"
    :data-app-theme="theme"
    :data-screen="view"
    aria-label="Android 交互演示"
  >
    <div class="app-system" aria-hidden="true">
      <strong>09:41</strong
      ><span
        >5G <SiteIcon name="signal" :size="14" /><SiteIcon name="wifi" :size="14" /><i>83</i></span
      >
    </div>
    <div v-if="subpage" class="app-subhead">
      <button type="button" aria-label="返回测试" @click="emit('select', 'tests')">‹</button
      ><b>{{ view === 'speed' ? '测速' : 'Wi-Fi 信道' }}</b>
    </div>
    <div
      ref="scroll"
      class="app-scroll"
      tabindex="0"
      :aria-label="androidFeature(view).label + '内容'"
    >
      <KeepAlive>
        <AndroidConnection
          v-if="view === 'connect'"
          :border
          @carrier="emit('carrier', $event)"
          @neighbors="emit('select', 'neighbors')"
        />
        <Neighbors v-else-if="view === 'neighbors'" @lock="lockCell" />
        <LockPanel v-else-if="view === 'lock'" :target />
        <SpeedPanel v-else-if="view === 'speed'" />
        <WifiPreview v-else-if="view === 'wifi'" />
      </KeepAlive>
      <div v-if="view === 'tests'" class="app-stack">
        <h3 class="app-page-name">测试</h3>
        <div class="app-card">
          <h3>网络诊断</h3>
          <button class="app-row" type="button" @click="emit('select', 'speed')">
            <SiteIcon name="timer" />测速 <span>就绪 ›</span></button
          ><button class="app-row" type="button" @click="emit('select', 'wifi')">
            <SiteIcon name="wifi" />Wi-Fi 信道 <span>周边扫描 ›</span>
          </button>
        </div>
      </div>
      <div v-if="view === 'settings'" class="app-stack">
        <h3 class="app-page-name">设置</h3>
        <section class="app-card">
          <h3>界面风格</h3>
          <p class="app-setting-label">外观模式</p>
          <div class="carrier-switch" role="group" aria-label="演示界面外观">
            <button
              v-for="option in ['light', 'dark'] as const"
              :key="option"
              type="button"
              :aria-pressed="theme === option"
              @click="appearance = option"
            >
              {{ option === 'dark' ? '深色' : '浅色' }}
            </button>
          </div>
          <p class="app-setting-label">信号质量样式</p>
          <div class="carrier-switch" role="group" aria-label="信号质量样式">
            <button type="button" :aria-pressed="!border" @click="border = false">磁贴内部条</button
            ><button type="button" :aria-pressed="border" @click="border = true">边框跑道</button>
          </div>
        </section>
        <button type="button" class="app-row" @click="emit('select', 'connect')">
          查看连接看板<span>›</span>
        </button>
      </div>
    </div>
    <nav
      v-if="!subpage"
      class="app-dock"
      aria-label="演示应用底栏"
      :style="{ '--dock-index': dock.findIndex((item) => item.id === activeNav) }"
    >
      <i aria-hidden="true"></i
      ><button
        v-for="item in dock"
        :key="item.id"
        type="button"
        :aria-pressed="activeNav === item.id"
        @click="emit('select', item.id)"
      >
        <SiteIcon :name="item.icon" :size="19" />{{ item.label }}
      </button>
    </nav>
    <div class="app-gesture" aria-hidden="true"></div>
  </div>
</template>
