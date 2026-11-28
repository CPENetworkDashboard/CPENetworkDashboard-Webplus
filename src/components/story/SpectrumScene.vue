<script setup lang="ts">
import { computed } from 'vue'
import { sessionTraffic, speedDuration, speedFrame } from '@/data/speedTrace'
import { bands, plotWidth, signalY, wifiPlot } from '@/data/wifiSpectrum'
import SpeedRealtimeCard, { formatSpeedNumber, SPEED_CHART_SECONDS } from './SpeedRealtimeCard.vue'
import { span } from './quality'
import '@/styles/spectrum-scene.css'

const props = defineProps<{ scene: 'speed' | 'wifi'; progress: number }>()
const position = computed(() =>
  Number.isFinite(props.progress) ? Math.max(0, Math.min(1, props.progress)) : 0
)

// Reveal the final 30-second window in place; neither time nor amplitude axes jump during playback.
const frame = speedFrame(speedDuration, SPEED_CHART_SECONDS)
const trace = computed(() => {
  const t = span(position.value, 0.12, 0.96)
  return t * t * (3 - 2 * t)
})
const sample = computed(() => Math.floor(trace.value * (SPEED_CHART_SECONDS - 1)))
const cards = computed(() =>
  frame.map((card) => ({
    ...card,
    rate: formatSpeedNumber(card.samples[sample.value] ?? card.rate),
    average: formatSpeedNumber(card.average) + ' Mbps',
    peak: formatSpeedNumber(card.peak) + ' Mbps',
  }))
)
const elapsed = [Math.floor(speedDuration / 60), speedDuration % 60]
  .map((value) => String(value).padStart(2, '0'))
  .join(':')

const bandIndex = computed(() =>
  Math.min(bands.length - 1, Math.floor(position.value * bands.length))
)
const band = computed(() => bands[bandIndex.value]!)
const plot = computed(() => wifiPlot(band.value))
const sweep = computed(() => position.value * bands.length - bandIndex.value)
const scanOpacity = computed(() =>
  sweep.value > 0 && sweep.value < 1 ? Math.sin(sweep.value * Math.PI) : 0
)
const plotHeight = 124
const levels = [-40, -60, -80] as const
</script>

<template>
  <div class="spectrum-scene" :data-scene="scene">
    <div v-if="scene === 'speed'" class="sp-throughput" aria-label="最近 30 秒的双向测速示例">
      <SpeedRealtimeCard
        v-for="card in cards"
        :key="card.direction"
        v-bind="card"
        :trace-progress="trace"
      />
      <dl class="sp-session">
        <div>
          <dt>总流量</dt>
          <dd>{{ sessionTraffic(speedDuration) }}</dd>
        </div>
        <div>
          <dt>用时</dt>
          <dd>{{ elapsed }}</dd>
        </div>
        <div>
          <dt>测试节点</dt>
          <dd>雷霆打流</dd>
        </div>
      </dl>
    </div>
    <div
      v-else
      class="sp-wifi"
      :data-band="band"
      :style="{ '--sp-sweep': sweep * 100 + '%', '--scan-opacity': scanOpacity }"
    >
      <section v-memo="[band]" class="sp-plate sp-spectrum">
        <header class="sp-heading">
          <h3>信道占用</h3>
          <ol class="sp-bands" aria-label="扫描频段">
            <li
              v-for="item in bands"
              :key="item"
              :aria-current="item === band ? 'step' : undefined"
            >
              {{ item }} GHz
            </li>
          </ol>
        </header>
        <div class="sp-graph" role="img" :aria-label="band + ' GHz 信道占用，纵轴为信号强度 dBm'">
          <div class="sp-strength" aria-hidden="true">
            <span
              v-for="level in levels"
              :key="level"
              :style="{ top: (signalY(level) / plotHeight) * 100 + '%' }"
              >{{ level }}</span
            >
          </div>
          <div class="sp-field">
            <svg
              :viewBox="'0 0 ' + plotWidth + ' ' + plotHeight"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <g class="sp-grid">
                <line
                  v-for="level in levels"
                  :key="level"
                  x1="0"
                  :x2="plotWidth"
                  :y1="signalY(level)"
                  :y2="signalY(level)"
                />
                <line
                  v-for="tick in plot.ticks"
                  :key="tick.channel"
                  :x1="tick.x"
                  :x2="tick.x"
                  y1="3"
                  y2="118"
                />
              </g>
              <path
                v-for="ap in plot.networks"
                :key="ap.name"
                class="sp-envelope"
                :d="ap.path"
                :fill="ap.color"
                :stroke="ap.color"
              />
            </svg>
            <i class="sp-sweep" aria-hidden="true"></i>
          </div>
          <small aria-hidden="true">dBm</small>
          <div class="sp-ticks" aria-hidden="true">
            <span
              v-for="tick in plot.ticks"
              :key="tick.channel"
              :style="{ left: (tick.x / plotWidth) * 100 + '%' }"
              >{{ tick.channel }}</span
            >
          </div>
        </div>
      </section>
      <section v-memo="[band]" class="sp-plate sp-hotspots">
        <header class="sp-heading">
          <h3>附近热点</h3>
          <span>{{ plot.networks.length }} 个热点</span>
        </header>
        <ul>
          <li v-for="ap in plot.networks" :key="ap.name">
            <i aria-hidden="true" :style="{ backgroundColor: ap.color }"></i>
            <b>{{ ap.name }}</b
            ><span>CH {{ ap.channel }}</span
            ><strong>{{ ap.level }} dBm</strong>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
