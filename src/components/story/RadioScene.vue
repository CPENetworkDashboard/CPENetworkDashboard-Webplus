<script setup lang="ts">
import { computed } from 'vue'
import { cellFacts, finalRadio } from './data'
import { clamp, level, score, span } from './quality'
import { radioNeighbors } from './PhoneNeighbors.vue'
import '@/styles/radio-scene.css'

const props = defineProps<{
  scene: 'connect' | 'neighbors' | 'lock'
  progress: number
}>()
const progress = computed(() => clamp(Number.isFinite(props.progress) ? props.progress : 0))

// Sample a shot at an absolute time so scrolling backwards and seeking produce the same frame.
function cue(start: number, end: number) {
  const t = span(progress.value, start, end)
  return t * t * (3 - 2 * t)
}

// The two snapshots match AndroidConnection. Identity fields and RF readings switch together.
const carriers = [
  {
    label: 'NR PCC',
    facts: cellFacts.map(([, value]) => value),
    rf: finalRadio.map((metric) => Number(metric.value)),
  },
  {
    label: 'NR SCC 1',
    facts: ['N78', '636666', '221', '63587/1', '1347599', '80 MHz'],
    rf: [-87, -12, 21, -66, 14],
  },
] as const
const carrierMix = computed(() => cue(0.43, 0.68))
const carrier = computed(() => carriers[carrierMix.value < 0.5 ? 0 : 1])
const separation = computed(() => 0.12 + 0.88 * cue(0.04, 0.38) * (1 - cue(0.63, 0.94)))
const rfUnits = ['dBm', 'dB', 'dB', 'dBm', '']
const rf = computed(() =>
  finalRadio.map(({ label }, index) => {
    const value = carrier.value.rf[index]
    const quality = level(label, value)!
    return { label, value, unit: rfUnits[index], quality, share: score[quality] * 100 + '%' }
  })
)

const neighbors = radioNeighbors.map((cell) => ({
  ...cell,
  displayPci: cell.pci + '/' + (Number(cell.pci) % 3),
}))
const neighborPosition = computed(() => cue(0.22, 0.42) + cue(0.55, 0.78))
const neighborIndex = computed(() => Math.round(neighborPosition.value))
const neighbor = computed(() => neighbors[neighborIndex.value])
const deviceStats = [
  ['WLAN接入', '1'],
  ['当日流量', '54.22 MB'],
] as const

const bandGroups = [
  {
    name: 'LTE',
    bands: ['B1', 'B3', 'B5', 'B7', 'B8', 'B20', 'B28', 'B38', 'B40', 'B41', 'B42', 'B43'],
  },
  {
    name: 'NR',
    bands: ['N1', 'N3', 'N5', 'N7', 'N8', 'N20', 'N28', 'N38', 'N40', 'N41', 'N77', 'N78'],
  },
] as const
const roleMix = computed(() => cue(0.31, 0.53))
const secondaryRole = computed(() => roleMix.value >= 0.5)
const bandReveal = computed(() => cue(0.57, 0.78))
const selectedBand = computed(() =>
  secondaryRole.value ? (bandReveal.value > 0 ? 'N78' : '') : 'B8'
)
const bandStatus = computed(() => {
  if (!secondaryRole.value) return '已选频段'
  if (!selectedBand.value) return '待选择频段'
  return progress.value < 0.86 ? '已选频段' : '已应用'
})
</script>

<template>
  <div class="radio-scene" :data-radio-scene="scene">
    <div
      v-if="scene === 'connect'"
      class="rs-board rs-connect"
      :data-carrier="carrier.label"
      :style="{ '--rs-depth': separation, '--rs-carrier': carrierMix }"
    >
      <div class="rs-deck">
        <section class="rs-plate rs-network">
          <div><small>中国移动 · 46000</small><strong>5G SA</strong></div>
          <span class="rs-online"
            ><i class="rs-signal" aria-hidden="true"><b></b><b></b><b></b><b></b></i
            >蜂窝已连接</span
          >
        </section>
        <section class="rs-plate rs-cell">
          <div class="rs-heading">
            <h3>当前小区</h3>
            <span class="rs-carriers">
              <b v-for="item in carriers" :key="item.label" :data-active="carrier === item">{{
                item.label
              }}</b>
            </span>
          </div>
          <dl class="rs-cell-facts">
            <div v-for="([label], index) in cellFacts" :key="label">
              <dt>{{ label }}</dt>
              <dd>{{ carrier.facts[index] }}</dd>
            </div>
          </dl>
        </section>
        <section class="rs-plate rs-rf">
          <div class="rs-heading">
            <h3>射频质量</h3>
            <small>{{ carrier.label }}</small>
          </div>
          <dl class="rs-rf-readings">
            <div
              v-for="metric in rf"
              :key="metric.label"
              :data-quality="metric.quality"
              :style="{ '--rs-share': metric.share }"
            >
              <dt>{{ metric.label }}</dt>
              <dd>
                {{ metric.value }}<small v-if="metric.unit">{{ metric.unit }}</small>
              </dd>
              <i aria-hidden="true"></i>
            </div>
          </dl>
        </section>
      </div>
    </div>

    <div
      v-else-if="scene === 'neighbors'"
      class="rs-board rs-neighbors"
      :data-pci="neighbor.pci"
      :style="{ '--rs-position': neighborPosition }"
    >
      <section class="rs-plate rs-device">
        <div><small>设备型号</small><strong>H153-381</strong></div>
        <dl>
          <div v-for="[label, value] in deviceStats" :key="label">
            <dt>{{ label }}</dt>
            <dd>{{ value }}</dd>
          </div>
        </dl>
      </section>
      <section class="rs-plate rs-neighbor-focus">
        <div class="rs-heading">
          <h3>邻区显示</h3>
          <small>LTE · {{ neighbor.band }}</small>
        </div>
        <div class="rs-identity">
          <div>
            <small>PCI</small><strong>{{ neighbor.displayPci }}</strong>
          </div>
          <div>
            <small>ARFCN</small><b>{{ neighbor.arfcn }}</b>
          </div>
          <div class="rs-pci-marks" aria-hidden="true">
            <i
              v-for="cell in neighbors"
              :key="cell.pci"
              :class="{ 'rs-current': cell.pci === neighbor.pci }"
            ></i>
          </div>
        </div>
        <dl class="rs-neighbor-rf">
          <div data-quality="poor">
            <dt>RSRP</dt>
            <dd>{{ neighbor.rsrp }}<small>dBm</small></dd>
          </div>
          <div :data-quality="level('RSRQ', Number(neighbor.rsrq))">
            <dt>RSRQ</dt>
            <dd>{{ neighbor.rsrq }}<small>dB</small></dd>
          </div>
          <div>
            <dt>SINR</dt>
            <dd>--</dd>
          </div>
        </dl>
      </section>
      <div class="rs-plate rs-neighbor-table" role="table" aria-label="B8 邻区信号对照">
        <div class="rs-table-head" role="row">
          <span
            v-for="label in ['Band', 'ARFCN', 'PCI', 'RSRP']"
            :key="label"
            role="columnheader"
            >{{ label }}</span
          >
        </div>
        <div class="rs-tracks" role="rowgroup">
          <div
            v-for="(cell, index) in neighbors"
            :key="cell.pci"
            class="rs-track"
            role="row"
            :data-active="index === neighborIndex"
          >
            <span role="cell">{{ cell.band }}</span
            ><span role="cell">{{ cell.arfcn }}</span
            ><b role="cell">{{ cell.displayPci }}</b
            ><span role="cell">{{ cell.rsrp }}</span>
          </div>
        </div>
      </div>
    </div>

    <div
      v-else
      class="rs-board rs-lock"
      :data-role="secondaryRole ? 'Scell' : 'Pcell+Scell'"
      :style="{ '--rs-role': roleMix, '--rs-reveal': secondaryRole ? bandReveal : 1 }"
    >
      <section class="rs-plate rs-role">
        <div class="rs-heading">
          <h3>频段角色</h3>
          <small>锁频段</small>
        </div>
        <div class="rs-roles">
          <b :data-active="!secondaryRole">Pcell+Scell</b><b :data-active="secondaryRole">Scell</b>
        </div>
      </section>
      <div class="rs-plate rs-spectrum">
        <section v-for="group in bandGroups" :key="group.name" class="rs-band-group">
          <h3>{{ group.name }} 频段</h3>
          <ul class="rs-band-grid">
            <li v-for="band in group.bands" :key="band" :data-selected="band === selectedBand">
              <i v-if="band === selectedBand" aria-hidden="true"></i>{{ band }}
            </li>
          </ul>
        </section>
      </div>
      <div class="rs-plate rs-lock-state">
        <span>{{ bandStatus }}</span
        ><b>{{ secondaryRole ? 'Scell' : 'Pcell+Scell' }}<em> / </em>{{ selectedBand || '—' }}</b>
      </div>
    </div>
  </div>
</template>
