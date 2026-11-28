<script lang="ts">
export const SPEED_CHART_SECONDS = 30

/** Precision used on the Android rate tiles, in the selected display unit. */
export function formatSpeedNumber(value: number): string {
  if (value === 0) return '0'
  if (value >= 100) return value.toFixed(0)
  if (value >= 10) return value.toFixed(1)
  return value.toFixed(value >= 1 ? 2 : 3)
}
</script>

<script setup lang="ts">
import { computed, useId } from 'vue'
import { clamp } from './quality'
import '@/styles/android-speed.css'

const props = withDefaults(
  defineProps<{
    direction: 'down' | 'up'
    rate: string
    average: string
    peak: string
    traffic: string
    /** One value per second, in the same unit as the headline. */
    samples: readonly number[]
    unit?: 'Mbps' | 'MB/s'
    reveal?: number
    traceProgress?: number | null
  }>(),
  { reveal: 1, unit: 'Mbps', traceProgress: null }
)

const title = computed(() => (props.direction === 'down' ? '下载' : '上传'))
const story = computed(() => props.traceProgress !== null)
const clipId = useId()
const clipWidth = computed(() => {
  const progress = clamp(props.traceProgress ?? 1)
  return progress === 1 ? 300 : progress === 0 ? 0 : 5 + 290 * progress
})
// The story passes continuous progress. Only rebuild the plot when a whole sample changes.
const end = computed(() =>
  Math.floor(props.samples.length * Math.min(1, Math.max(0, props.reveal)))
)
const visible = computed(() =>
  props.samples.slice(Math.max(0, end.value - SPEED_CHART_SECONDS), end.value)
)
const maximum = computed(() => Math.max(1, ...visible.value))
const points = computed(() =>
  visible.value.map((value, index) => ({
    // Anchor the newest sample at “现在”, even while the window is filling.
    x: 295 - (visible.value.length - 1 - index) * (290 / (SPEED_CHART_SECONDS - 1)),
    y: 92 - (value / maximum.value) * 84,
  }))
)
const curve = computed(() => {
  const [first, ...rest] = points.value
  if (!first) return ''
  let previous = first
  let path = `M${first.x},${first.y}`
  for (const point of rest) {
    // Android uses a horizontal tangent on either side, bounded by the two readings.
    const mid = (previous.x + point.x) / 2
    path += ` C${mid},${previous.y} ${mid},${point.y} ${point.x},${point.y}`
    previous = point
  }
  return path
})
const latest = computed(() => points.value[points.value.length - 1])
const axis = (value: number) => {
  if (props.unit === 'MB/s') return formatSpeedNumber(value)
  return value < 1 ? Math.round(value * 1000) + 'K' : formatSpeedNumber(value) + 'M'
}
</script>

<template>
  <section class="pm-speed-card" :class="direction" :aria-label="title + '速率'">
    <header>
      <i aria-hidden="true">{{ direction === 'down' ? '↓' : '↑' }}</i>
      <div>
        <b>{{ title }}</b
        ><span v-if="!story">实时速率</span>
      </div>
    </header>
    <p class="pm-speed-headline">
      <strong>{{ rate }}</strong> <span>{{ unit }}</span>
    </p>
    <div
      class="pm-speed-chart"
      role="img"
      :aria-label="title + '最近 30 秒，' + (latest ? '最新 ' + rate + ' ' + unit : '等待速率数据')"
    >
      <div class="pm-speed-axis" aria-hidden="true">
        <span>{{ axis(maximum) }}</span
        ><span>{{ axis(maximum / 2) }}</span
        ><span>{{ axis(0) }}</span>
      </div>
      <div class="pm-speed-plot">
        <svg viewBox="0 0 300 100" preserveAspectRatio="none" aria-hidden="true">
          <defs v-if="story">
            <clipPath :id="clipId"><rect :width="clipWidth" height="100" /></clipPath>
          </defs>
          <path class="grid" d="M0 8H300M0 50H300M0 92H300" />
          <g v-memo="[points, story]" :clip-path="story ? 'url(#' + clipId + ')' : undefined">
            <path v-if="latest && !story" class="guide" :d="'M0 ' + latest.y + 'H300'" />
            <line v-for="p in points" :key="p.x" :x1="p.x" :x2="p.x" :y1="p.y" y2="92" />
            <path v-if="points.length > 1" class="speed-curve" :d="curve" />
            <template v-for="(p, index) in points" :key="p.x">
              <circle v-if="!story || index === points.length - 1" :cx="p.x" :cy="p.y" r="2.2" />
            </template>
          </g>
        </svg>
        <span v-if="!latest">等待速率数据</span>
      </div>
    </div>
    <div class="pm-speed-times" aria-hidden="true">
      <span>−30 秒</span><span v-if="!story">−15 秒</span><span>现在</span>
    </div>
    <dl>
      <div>
        <dt>平均</dt>
        <dd>{{ average }}</dd>
      </div>
      <div>
        <dt>平滑峰值</dt>
        <dd>{{ peak }}</dd>
      </div>
      <div>
        <dt>{{ title }}流量</dt>
        <dd>{{ traffic }}</dd>
      </div>
    </dl>
  </section>
</template>
