<script setup lang="ts">
import { computed, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref } from 'vue'
import SpeedRealtimeCard, {
  formatSpeedNumber,
  SPEED_CHART_SECONDS,
} from './story/SpeedRealtimeCard.vue'
import { sessionTraffic, speedDuration, speedFrame } from '@/data/speedTrace'
import '@/styles/android-speed.css'

type Phase = 'complete' | 'running' | 'paused' | 'stopped'
const labels: Record<Phase, string> = {
  complete: '已完成',
  running: '双向中',
  paused: '已暂停',
  stopped: '已停止',
}
const phase = ref<Phase>('complete')
const elapsed = ref(speedDuration)
const unit = ref<'Mbps' | 'MB/s'>('Mbps')
const root = ref<HTMLElement>()
const cards = computed(() =>
  speedFrame(elapsed.value, SPEED_CHART_SECONDS, unit.value === 'Mbps' ? 1 : 8).map((card) => ({
    ...card,
    rate: formatSpeedNumber(card.rate),
    average: formatSpeedNumber(card.average) + ' ' + unit.value,
    peak: formatSpeedNumber(card.peak) + ' ' + unit.value,
  }))
)
const total = computed(() => sessionTraffic(elapsed.value))
const time = computed(() =>
  [Math.floor(elapsed.value / 60), elapsed.value % 60]
    .map((n) => String(n).padStart(2, '0'))
    .join(':')
)

let timer: number | undefined
let observer: IntersectionObserver | undefined
let active = false
let inView = true

function halt(next: Phase) {
  window.clearInterval(timer)
  timer = undefined
  phase.value = next
}
function pause() {
  if (phase.value === 'running') halt('paused')
}
function togglePlayback() {
  if (phase.value === 'running') return pause()
  if (!active || document.hidden || !inView) return
  if (phase.value !== 'paused') elapsed.value = 0
  phase.value = 'running'
  timer = window.setInterval(() => {
    elapsed.value++
    if (elapsed.value === speedDuration) halt('complete')
  }, 1000)
}
function visibilityChanged() {
  if (document.hidden) pause()
}
function activate() {
  if (active || !root.value) return
  active = true
  inView = true
  document.addEventListener('visibilitychange', visibilityChanged)
  if (typeof IntersectionObserver !== 'undefined') {
    observer = new IntersectionObserver((entries, source) => {
      // An observer disconnected by KeepAlive can still have queued entries.
      if (source !== observer) return
      const entry = entries[entries.length - 1]
      if (!entry) return
      inView = entry.isIntersecting
      if (!inView) pause()
    })
    observer.observe(root.value)
  }
}
function deactivate() {
  if (!active) return
  active = false
  pause()
  document.removeEventListener('visibilitychange', visibilityChanged)
  observer?.disconnect()
  observer = undefined
}
onMounted(activate)
onActivated(activate)
onDeactivated(deactivate)
onBeforeUnmount(deactivate)
</script>

<template>
  <section ref="root" class="android-speed-panel" aria-label="双向测速示例">
    <div class="speed-toolbar">
      <span class="speed-status" :data-phase="phase" role="status">{{ labels[phase] }}</span>
      <div class="speed-actions">
        <button type="button" class="speed-primary" @click="togglePlayback">
          {{ phase === 'running' ? '暂停' : phase === 'paused' ? '继续' : '重播示例' }}
        </button>
        <button
          v-if="phase === 'running' || phase === 'paused'"
          type="button"
          @click="halt('stopped')"
        >
          停止
        </button>
      </div>
    </div>
    <p class="speed-note">本地示例每秒回放一次，不产生测速流量。</p>
    <SpeedRealtimeCard v-for="card in cards" :key="card.direction" v-bind="card" :unit />
    <dl class="speed-summary">
      <div>
        <dt>总流量</dt>
        <dd>{{ total }}</dd>
      </div>
      <div>
        <dt>用时</dt>
        <dd>{{ time }}</dd>
      </div>
      <div>
        <dt>测试节点</dt>
        <dd>雷霆江苏</dd>
      </div>
    </dl>
    <div class="speed-units" role="group" aria-label="速率显示单位">
      <span>显示单位</span>
      <div>
        <button
          v-for="option in ['Mbps', 'MB/s'] as const"
          :key="option"
          type="button"
          :aria-pressed="unit === option"
          @click="unit = option"
        >
          {{ option }}
        </button>
      </div>
    </div>
  </section>
</template>
