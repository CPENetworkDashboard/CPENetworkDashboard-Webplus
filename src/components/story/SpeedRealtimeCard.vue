<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    direction: 'down' | 'up'
    rate: string
    average: string
    peak: string
    traffic: string
    samples: number[]
    reveal?: number
  }>(),
  { reveal: 1 }
)

const visibleCount = computed(() =>
  Math.min(props.samples.length, Math.max(0, Math.ceil(props.samples.length * props.reveal)))
)
const visible = computed(() => props.samples.slice(0, visibleCount.value))
const maximum = computed(() => Math.max(1, ...visible.value))
const coordinates = computed(() =>
  visible.value.map((value, index) => ({
    x: 5 + (index / Math.max(1, props.samples.length - 1)) * 290,
    y: 92 - (value / maximum.value) * 76,
  }))
)
const points = computed(() =>
  coordinates.value.map(({ x, y }) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
)
const latestY = computed(() => coordinates.value[coordinates.value.length - 1]?.y ?? 92)
const axis = (value: number) => (value >= 100 ? Math.round(value) : value.toFixed(1))
const title = computed(() => (props.direction === 'down' ? '下载' : '上传'))
</script>

<template>
  <section class="pm-speed-card" :class="direction">
    <header>
      <i aria-hidden="true">{{ direction === 'down' ? '↓' : '↑' }}</i>
      <div>
        <b>{{ title }}</b
        ><span>实时速率</span>
      </div>
    </header>
    <p class="pm-speed-headline">
      <strong>{{ rate }}</strong
      ><span>Mbps</span>
    </p>
    <div class="pm-speed-chart">
      <div class="pm-speed-axis" aria-hidden="true">
        <span>{{ axis(maximum) }}M</span><span>{{ axis(maximum / 2) }}M</span><span>0</span>
      </div>
      <div class="pm-speed-plot">
        <svg viewBox="0 0 300 100" preserveAspectRatio="none" aria-hidden="true">
          <path class="grid" d="M0 8H300M0 50H300M0 92H300" />
          <path class="guide" :d="`M0 ${latestY}H300`" />
          <template v-for="(point, index) in coordinates" :key="index">
            <line :x1="point.x" :x2="point.x" :y1="point.y" y2="92" />
            <circle :cx="point.x" :cy="point.y" r="2.2" />
          </template>
          <polyline v-if="coordinates.length > 1" :points="points" />
        </svg>
        <span v-if="!coordinates.length">等待速率数据</span>
      </div>
    </div>
    <div class="pm-speed-times" aria-hidden="true">
      <span>-30秒</span><span>-15秒</span><span>现在</span>
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
