<script setup lang="ts">
import { computed, ref } from 'vue'
import { bands, wifiPlot, type Band } from '@/data/wifiSpectrum'

const selected = ref<Band>('5')
const data = computed(() => wifiPlot(selected.value))
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
          v-for="ap in data.networks"
          :key="ap.name"
          :d="ap.path"
          :stroke="ap.color"
          :fill="ap.color"
        />
      </g>
      <text v-for="tick in data.ticks" :key="tick.channel" :x="tick.x" y="140" text-anchor="middle">
        {{ tick.channel }}
      </text>
    </svg>
    <div class="wifi-readings" aria-live="polite">
      <div v-for="ap in data.networks" :key="ap.name">
        <i :style="{ background: ap.color }" aria-hidden="true"></i><b>{{ ap.name }}</b
        ><small>CH {{ ap.channel }}</small
        ><span>{{ ap.level }} dBm</span>
      </div>
    </div>
  </div>
</template>
