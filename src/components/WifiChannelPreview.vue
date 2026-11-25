<script setup lang="ts">
import { computed, ref } from 'vue'

type Band = '2.4' | '5' | '6'
interface AccessPoint {
  name: string
  channel: number
  level: number
  spread: number
}
interface Spectrum {
  ticks: number[]
  networks: AccessPoint[]
}

const bands: Band[] = ['2.4', '5', '6']
const spectrum: Record<Band, Spectrum> = {
  '2.4': {
    ticks: [1, 3, 6, 9, 11, 13],
    networks: [
      { name: 'ChinaNet-7K', channel: 6, level: -48, spread: 2.3 },
      { name: 'TP-LINK_3B', channel: 11, level: -55, spread: 2.3 },
      { name: 'CMCC-A8F2', channel: 1, level: -71, spread: 2.3 },
    ],
  },
  '5': {
    ticks: [36, 64, 100, 132, 165],
    networks: [
      { name: 'HUAWEI-H168', channel: 44, level: -48, spread: 11 },
      { name: 'ChinaNet-7K', channel: 52, level: -57, spread: 11 },
      { name: 'CMCC-5G-A8F2', channel: 149, level: -63, spread: 10 },
    ],
  },
  '6': {
    ticks: [1, 5, 9, 13, 17, 21],
    networks: [
      { name: 'CPE-6G', channel: 5, level: -54, spread: 4.3 },
      { name: 'Office-6E', channel: 17, level: -68, spread: 4.3 },
    ],
  },
}
const selected = ref<Band>('5')
const data = computed(() => spectrum[selected.value])
const colors = ['#85e5bc', '#9bbfff', '#efb47b']
function x(channel: number) {
  const ticks = data.value.ticks
  return 24 + ((channel - ticks[0]!) / (ticks[ticks.length - 1]! - ticks[0]!)) * 392
}
function curve(ap: AccessPoint) {
  const left = x(ap.channel - ap.spread),
    center = x(ap.channel),
    right = x(ap.channel + ap.spread)
  const top = 118 - (ap.level + 91) * 2.1
  return (
    'M ' +
    left +
    ' 118 C ' +
    (left + center) / 2 +
    ' 118 ' +
    (left + center) / 2 +
    ' ' +
    top +
    ' ' +
    center +
    ' ' +
    top +
    ' S ' +
    (center + right) / 2 +
    ' 118 ' +
    right +
    ' 118'
  )
}
</script>

<template>
  <div class="wifi-preview">
    <header><span>信道占用</span><small>示例数据</small></header>
    <div class="wifi-controls" role="group" aria-label="选择 Wi-Fi 频段">
      <button
        v-for="band in bands"
        :key="band"
        type="button"
        :aria-pressed="selected === band"
        @click="selected = band"
      >
        {{ band }} GHz
      </button>
    </div>
    <svg
      class="pm-wifi wifi-plot"
      viewBox="0 0 440 146"
      role="img"
      :aria-label="selected + ' GHz 信道占用，' + data.networks.length + ' 个热点'"
    >
      <g class="wifi-grid" aria-hidden="true">
        <path d="M0 20H440 M0 52H440 M0 85H440 M0 118H440" />
      </g>
      <g :key="selected" class="wifi-curves" aria-hidden="true">
        <path
          v-for="(ap, i) in data.networks"
          :key="ap.name"
          :d="curve(ap)"
          :stroke="colors[i]"
          :fill="colors[i]"
        />
      </g>
      <text v-for="tick in data.ticks" :key="tick" :x="x(tick)" y="140" text-anchor="middle">
        {{ tick }}
      </text>
    </svg>
    <div class="wifi-readings" aria-live="polite">
      <div v-for="(ap, i) in data.networks" :key="ap.name">
        <i :style="{ background: colors[i] }" aria-hidden="true"></i><b>{{ ap.name }}</b
        ><small>CH {{ ap.channel }}</small
        ><span>{{ ap.level }} dBm</span>
      </div>
    </div>
  </div>
</template>
