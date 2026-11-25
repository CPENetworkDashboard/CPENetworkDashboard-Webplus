<script setup lang="ts">
import { computed, ref } from 'vue'
import SiteIcon from './SiteIcon.vue'
import { cellFacts, finalRadio } from './story/data'

const sections = [
  { id: 'connect', name: '连接', icon: 'signal' },
  { id: 'lock', name: '锁频', icon: 'lock' },
  { id: 'test', name: '测试', icon: 'activity' },
] as const
const page = ref<(typeof sections)[number]['id']>('connect')
const lte = ref<'B3' | 'B8'>('B8'),
  applied = ref<string>(''),
  readout = ref(false)
const testRecord = ref<'Ping' | '路由测试'>('Ping')
const records = {
  Ping: [
    ['最短', '18 ms'],
    ['平均', '24 ms'],
    ['最长', '32 ms'],
    ['丢包', '0%'],
  ],
  路由测试: [
    ['第 1 跳', '192.0.2.1'],
    ['第 2 跳', '198.51.100.1'],
    ['目标', '203.0.113.1'],
  ],
}
function chooseBand(band: 'B3' | 'B8') {
  lte.value = band
  readout.value = false
}
function applyBand() {
  applied.value = lte.value
  readout.value = true
}
const activeName = computed(() => sections.find((section) => section.id === page.value)!.name)
</script>
<template>
  <div class="desktop-app">
    <div class="desktop-titlebar">
      <i aria-hidden="true"></i><b>CPE网络看板</b><span>桌面端 · 示例设备</span>
    </div>
    <div class="desktop-shell">
      <nav class="desktop-nav" aria-label="桌面端演示">
        <button
          v-for="s in sections"
          :key="s.id"
          type="button"
          :aria-pressed="page === s.id"
          @click="page = s.id"
        >
          <SiteIcon :name="s.icon" :size="17" />{{ s.name }}
        </button>
      </nav>
      <div class="desktop-work">
        <h3>{{ activeName }}</h3>
        <div :key="page" class="desktop-pane">
          <template v-if="page === 'connect'"
            ><h4>当前小区（NR PCC）</h4>
            <dl>
              <div v-for="[key, value] in cellFacts" :key="key">
                <dt>{{ key }}</dt>
                <dd>{{ value }}</dd>
              </div>
            </dl>
            <h4>射频质量</h4>
            <dl>
              <div v-for="m in finalRadio.slice(0, 3)" :key="m.label">
                <dt>{{ m.label }}</dt>
                <dd>{{ m.value }}</dd>
              </div>
            </dl></template
          >
          <template v-else-if="page === 'lock'"
            ><h4>LTE 频段</h4>
            <div class="desk-controls">
              <button
                v-for="band in ['B3', 'B8'] as const"
                :key="band"
                :aria-pressed="band === lte"
                type="button"
                @click="chooseBand(band)"
              >
                {{ band }}
              </button>
            </div>
            <button class="desk-apply" type="button" @click="applyBand">应用并回读</button>
            <p role="status">
              {{ readout ? '回读频段 ' + applied : '选择要驻留的 LTE 频段。' }}
            </p></template
          >
          <template v-else
            ><h4>诊断记录</h4>
            <div class="desk-controls">
              <button
                v-for="record in ['Ping', '路由测试'] as const"
                :key="record"
                type="button"
                :aria-pressed="testRecord === record"
                @click="testRecord = record"
              >
                {{ record }}
              </button>
            </div>
            <dl>
              <div v-for="[key, value] in records[testRecord]" :key="key">
                <dt>{{ key }}</dt>
                <dd>{{ value }}</dd>
              </div>
            </dl></template
          >
        </div>
      </div>
    </div>
  </div>
</template>
