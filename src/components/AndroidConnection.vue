<script setup lang="ts">
import { computed, ref } from 'vue'
import { cellFacts, finalRadio, finalPower } from './story/data'
import { level, score } from './story/quality'

defineProps<{ border: boolean }>()
const emit = defineEmits<{ neighbors: []; carrier: [value: 'primary' | 'secondary'] }>()
const secondary = ref(false)
const carrier = computed(() => (secondary.value ? 'NR SCC 1' : 'NR PCC'))
function selectCarrier(next: boolean) {
  secondary.value = next
  emit('carrier', next ? 'secondary' : 'primary')
}
const values = ['N78', '636666', '221', '63587/1', '1347599', '80 MHz']
const alternate = [-87, -12, 21, -66, 14]
const facts = computed(() =>
  cellFacts.map(([label, value], i) => ({ label, value: secondary.value ? values[i] : value }))
)
const radio = computed(() =>
  finalRadio.map((metric, i) => {
    const value = secondary.value ? String(alternate[i]) : metric.value
    const quality = level(metric.label, Number(value))!
    return { label: metric.label, value, quality, share: score[quality] * 100 + '%' }
  })
)
</script>

<template>
  <div class="app-stack">
    <section class="app-card connection-overview">
      <div>
        <strong>中国移动 46000 · 5G SA</strong
        ><span class="cell-bars" aria-label="5G 信号"><i></i><i></i><i></i><i></i></span>
      </div>
      <p>SIM卡AMBR <span>暂无数据</span></p>
      <b>蜂窝已连接</b>
    </section>
    <section class="app-card">
      <h3>当前小区（{{ carrier }}）</h3>
      <div class="carrier-switch" role="group" aria-label="查看载波">
        <button type="button" :aria-pressed="!secondary" @click="selectCarrier(false)">
          NR PCC</button
        ><button type="button" :aria-pressed="secondary" @click="selectCarrier(true)">
          NR SCC 1
        </button>
      </div>
      <dl class="app-metrics">
        <div v-for="fact in facts" :key="fact.label">
          <dt>{{ fact.label }}</dt>
          <dd>{{ fact.value }}</dd>
        </div>
      </dl>
    </section>
    <section class="app-card">
      <h3>射频质量（{{ carrier }}）</h3>
      <dl class="app-metrics radio-metrics" :class="{ outlined: border }">
        <div v-for="m in radio" :key="m.label" :class="m.quality" :style="{ '--share': m.share }">
          <dt>{{ m.label }}</dt>
          <dd>{{ m.value }}</dd>
          <i aria-hidden="true"></i>
        </div>
      </dl>
    </section>
    <section class="app-card">
      <h3>当前功率（{{ carrier }}）</h3>
      <dl class="app-metrics power-metrics">
        <div v-for="m in finalPower" :key="m.label">
          <dt>{{ m.label }}</dt>
          <dd>{{ m.value }}</dd>
        </div>
      </dl>
    </section>
    <button class="app-row" type="button" @click="emit('neighbors')">
      设备信息与邻区<span aria-hidden="true">›</span>
    </button>
  </div>
</template>
