<script setup lang="ts">
import { computed, toRef } from 'vue'
import PhoneTile from './PhoneTile.vue'
import RollNumber from './RollNumber.vue'
import SpeedRealtimeCard from './SpeedRealtimeCard.vue'
import { W } from './data'
import { ease, pop, span } from './quality'

const props = defineProps<{ t: number; on?: boolean; mode: 'screen' | 'stage' | 'back' }>()
const t = toRef(props, 't')

const downSamples = [
  468, 472, 465, 471, 466, 476, 473, 480, 475, 469, 472, 479, 463, 451, 444, 447, 458, 481, 474,
  478, 475, 473, 476, 469, 470, 481, 486, 492, 499, 508,
]
const upSamples = [
  54, 56, 53, 51, 48, 46, 44, 42, 40, 39, 38, 39, 41, 44, 47, 49, 52, 55, 58, 57, 54, 53, 56, 59,
  61, 60, 66, 72, 78, 84.2,
]
const run = computed(() => span(t.value, 0.04, 0.42))
const sampleCount = computed(() => Math.floor(run.value * downSamples.length))
const seenDown = computed(() => downSamples.slice(0, sampleCount.value))
const seenUp = computed(() => upSamples.slice(0, sampleCount.value))
const down = computed(() => seenDown.value[seenDown.value.length - 1] ?? 0)
const up = computed(() => seenUp.value[seenUp.value.length - 1] ?? 0)
const mean = (list: number[]) => (list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0)
const downAverage = computed(() => Math.round(mean(seenDown.value)))
const upAverage = computed(() => mean(seenUp.value).toFixed(1))
const downPeak = computed(() => Math.round(Math.max(0, ...seenDown.value)))
const upPeak = computed(() => Math.max(0, ...seenUp.value).toFixed(1))
const speed = computed(() => t.value < 0.5)
const out = computed(() => pop(span(t.value, 0.02, 0.16)))
const bubble = computed(() => pop(span(t.value, 0.22, 0.34)))

const pingSamples = [26, 31, 24, 33, 28, 36, 34, 32, 30, 43, 29, 27]
const pingK = computed(() => span(t.value, 0.56, 0.92))
const pingCount = computed(() => Math.round(pingK.value * pingSamples.length))
const seen = computed(() => pingSamples.slice(0, pingCount.value))
const avg = computed(() =>
  seen.value.length ? seen.value.reduce((a, b) => a + b, 0) / seen.value.length : 0
)
const pingStats = computed(() => {
  const ms = (v?: number) => (v === undefined ? '—' : `${v.toFixed(1)} ms`)
  const list = seen.value
  return [
    ['已发送', String(list.length)],
    ['已接收', String(list.length)],
    ['丢包率', '0%'],
    ['最小', ms(list.length ? Math.min(...list) : undefined)],
    ['平均', ms(list.length ? avg.value : undefined)],
    ['最大', ms(list.length ? Math.max(...list) : undefined)],
  ]
})
const chartPoint = (v: number, i: number, w: number, h: number) =>
  [(i / (pingSamples.length - 1)) * w, h - ((v - 18) / 30) * h] as const
const phonePoints = computed(() => seen.value.map((v, i) => chartPoint(v, i, 336, 130)))
const wide = computed(() => seen.value.map((v, i) => chartPoint(v, i, 1000, 300)))
const path = (list: ReadonlyArray<readonly [number, number]>) =>
  list.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
const pingOut = computed(() => ease(span(t.value, 0.54, 0.62)))
</script>

<template>
  <template v-if="mode === 'screen'">
    <template v-if="speed">
      <div class="pm-page-status"><i></i>{{ sampleCount ? '双向中' : '准备中' }}</div>
      <SpeedRealtimeCard
        direction="down"
        :rate="String(Math.round(down))"
        :average="`${downAverage} Mbps`"
        :peak="`${downPeak} Mbps`"
        :traffic="`${(9.35 * run).toFixed(2)} GB`"
        :samples="downSamples"
        :reveal="run"
      />
      <SpeedRealtimeCard
        direction="up"
        :rate="up.toFixed(1)"
        :average="`${upAverage} Mbps`"
        :peak="`${upPeak} Mbps`"
        :traffic="`${(1.03 * run).toFixed(2)} GB`"
        :samples="upSamples"
        :reveal="run"
      />
    </template>
    <template v-else>
      <div class="pm-card">
        <h4>Ping</h4>
        <div class="pm-field plain">www.taobao.com</div>
        <div class="pm-actions">
          <span class="fill">{{ pingCount < pingSamples.length ? 'Ping 中…' : '开始 Ping' }}</span>
        </div>
      </div>
      <div class="pm-card">
        <div class="pm-grid c3">
          <PhoneTile v-for="[label, value] in pingStats" :key="label" :label :value :w="W.c3" />
        </div>
      </div>
      <div class="pm-card glow">
        <h4>延迟曲线</h4>
        <svg class="pm-chart" viewBox="-8 -8 352 146">
          <path class="grid" d="M0 0H336M0 43H336M0 86H336M0 130H336" />
          <polyline v-if="phonePoints.length > 1" :points="path(phonePoints)" />
          <circle v-for="([x, y], index) in phonePoints" :key="index" :cx="x" :cy="y" r="4.5" />
        </svg>
      </div>
    </template>
  </template>

  <div v-else-if="mode === 'back'" class="story-layer back" :class="{ on }" aria-hidden="true">
    <svg
      class="story-wave"
      viewBox="-20 -20 1040 340"
      preserveAspectRatio="none"
      :style="{ opacity: pingOut }"
    >
      <polyline v-if="wide.length > 1" :points="path(wide)" />
      <circle v-for="([x, y], index) in wide" :key="index" :cx="x" :cy="y" r="7" />
    </svg>
  </div>

  <div v-else class="story-layer" :class="{ on }" aria-hidden="true">
    <div class="story-float" :style="{ '--f': bubble * (speed ? 1 : 0) }">
      <span>↓ {{ down }} <small>Mbps</small></span
      ><span>↑ {{ up }} <small>Mbps</small></span>
    </div>
    <div class="story-speed" :style="{ '--o': out }">
      <template v-if="speed"><RollNumber :value="String(down)" /><small>Mbps 下载</small></template>
      <template v-else><RollNumber :value="avg.toFixed(1)" /><small>ms 平均延迟</small></template>
    </div>
  </div>
</template>
