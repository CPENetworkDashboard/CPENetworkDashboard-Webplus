<script setup lang="ts">
import { computed } from 'vue'
import { deviceStats, radioNeighbors } from '@/data/androidPreview'
import SiteIcon from '../SiteIcon.vue'
import AndroidGlyph from './AndroidGlyph.vue'
import { cellFacts, finalPower, finalRadio, radioCarriers as carriers } from './data'
import { level, score, span } from './quality'
import '@/styles/radio-scene.css'

const props = defineProps<{
  scene: 'connect' | 'links' | 'neighbors' | 'lock' | 'tests' | 'settings'
  progress: number
  panels?: boolean
}>()

const aggregationFields = ['Type', 'Band', 'ARFCN', 'PCI', 'BW', 'RSRP', 'RSRQ', 'SINR']
const carrier = computed(() => carriers[props.progress < 0.55 ? 0 : 1])
const currentCell = computed(() =>
  cellFacts
    .map(([label], index) => ({ label, value: carrier.value.values[index] }))
    .filter(({ value }) => value)
)
const carrierMenu = computed(() => props.progress >= 0.38 && props.progress < 0.55)
const units = ['dBm', 'dB', 'dB', 'dBm', '']
const readings = computed(() =>
  finalRadio.map(({ label }, index) => {
    const value = carrier.value.rf[index]!
    const quality = level(label, value)!
    return { label, value, quality, unit: units[index], fill: score[quality] }
  })
)
const tests = [
  ['Ping', '就绪', 'activity'],
  ['测速', '就绪', 'timer'],
  ['路由测试', '就绪', 'globe'],
  ['会话数', '就绪', 'signal'],
  ['Wi-Fi 信道', '周边扫描', 'wifi'],
] as const
const currentNeighbor = computed(() => Math.min(2, Math.floor(props.progress * 3)))
const lockTabs = ['网络首选', '锁频段', '锁频点', '锁小区']
const bandGroups = {
  LTE: ['B1', 'B3', 'B5', 'B7', 'B8', 'B20', 'B28', 'B38', 'B40', 'B41', 'B42', 'B43'],
  NR: ['N1', 'N3', 'N5', 'N7', 'N8', 'N20', 'N28', 'N38', 'N40', 'N41', 'N77', 'N78'],
}
const secondaryRole = computed(() => props.progress > 0.43)
const selectedBand = computed(() =>
  secondaryRole.value ? (props.progress > 0.56 ? 'N78' : '') : 'B8'
)
const applying = computed(() => props.progress >= 0.7 && props.progress < 0.87)
const applied = computed(() => props.progress >= 0.87)
const settingsDetail = computed(() => props.panels || props.progress >= 0.24)
const styleLight = computed(() => props.progress >= 0.56)
const readingFill = computed(() => 0.36 + 0.64 * span(props.progress, 0.06, 0.38))
const readingFocus = computed(
  () => span(props.progress, 0.08, 0.26) * (1 - span(props.progress, 0.44, 0.8))
)
</script>

<template>
  <div class="radio-scene" :data-radio-scene="scene">
    <template v-if="scene === 'connect'">
      <section class="android-card rs-overview" :data-menu="carrierMenu">
        <header class="rs-operator">
          <b>中国移动 5G SA</b>
          <SiteIcon name="chevron" :size="13" />
          <div class="rs-signal"><AndroidGlyph name="signal" /><strong>5G</strong></div>
        </header>
        <p>SIM卡AMBR 暂无数据 <span class="rs-ambr">获取</span></p>
        <span class="rs-online"><i></i>蜂窝已连接</span>
        <ul v-if="carrierMenu" class="rs-carrier-menu">
          <li v-for="item in carriers" :key="item.label">
            <div>
              <b>{{ item.label }}</b
              ><small>{{ item.values[0] }} · PCI {{ item.values[2] }}</small>
            </div>
            <SiteIcon v-if="item === carrier" name="check" :size="14" />
          </li>
        </ul>
      </section>
      <section class="android-card rs-cell" :data-carrier="carrier.label">
        <header class="android-card-heading">
          <h3>当前小区（{{ carrier.label }}）</h3>
        </header>
        <dl class="rs-metrics rs-current-cell">
          <div v-for="{ label, value } in currentCell" :key="label" :data-metric="label">
            <dt>{{ label }}</dt>
            <dd :key="value">{{ value }}</dd>
          </div>
        </dl>
      </section>
      <section
        class="android-card rs-rf"
        :style="{ '--reading-focus': readingFocus, '--reading-fill': readingFill }"
      >
        <header class="android-card-heading">
          <h3>射频质量（{{ carrier.label }}）</h3>
        </header>
        <dl class="rs-metrics rs-rf-readings">
          <div v-for="metric in readings" :key="metric.label" :data-quality="metric.quality">
            <dt>{{ metric.label }}</dt>
            <dd :key="metric.value">
              {{ metric.value }}<small v-if="metric.unit">{{ metric.unit }}</small>
            </dd>
            <i :style="{ '--strength': metric.fill }"></i>
          </div>
        </dl>
      </section>
    </template>

    <template v-else-if="scene === 'links'">
      <section class="android-card rs-ca">
        <header class="android-card-heading">
          <div>
            <h3>载波聚合</h3>
            <span>{{ carriers.length }}CC</span>
          </div>
          <SiteIcon name="chevron" :size="14" />
        </header>
        <table class="rs-ca-table">
          <colgroup>
            <col span="2" />
            <col class="rs-ca-frequency" />
            <col span="5" />
            <col class="rs-ca-check" />
          </colgroup>
          <thead>
            <tr>
              <th v-for="label in aggregationFields" :key="label" scope="col">{{ label }}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(item, index) in carriers"
              :key="item.label"
              :data-current="index === (progress < 0.5 ? 0 : 1)"
            >
              <td>{{ item.type }}</td>
              <td>{{ item.values[0] }}</td>
              <td>{{ item.values[1] }}</td>
              <td>{{ item.values[2] }}</td>
              <td>{{ item.values[5]?.split(' ')[0] }}</td>
              <td
                v-for="(value, metricIndex) in item.rf.slice(0, 3)"
                :key="metricIndex"
                :data-quality="level(finalRadio[metricIndex]!.label, value)"
              >
                {{ value }}
              </td>
              <td><SiteIcon name="check" :size="12" /></td>
            </tr>
          </tbody>
        </table>
      </section>
      <section class="android-card rs-power">
        <header class="android-card-heading"><h3>当前功率（NR PCC）</h3></header>
        <dl class="rs-metrics">
          <div v-for="metric in finalPower" :key="metric.label">
            <dt>{{ metric.label }}</dt>
            <dd>{{ metric.value }}</dd>
          </div>
        </dl>
      </section>
      <section class="android-card rs-link">
        <div>
          <h3>下行链路（NR PCC）</h3>
          <span>Mod 256QAM</span><span>MCS 24</span><span>RANK 2</span>
        </div>
        <div>
          <h3>上行链路（NR PCC）</h3>
          <span>Mod 64QAM</span><span>MCS 16</span>
        </div>
      </section>
    </template>

    <template v-else-if="scene === 'neighbors'">
      <section class="android-card rs-device">
        <header class="android-card-heading"><h3>设备信息</h3></header>
        <dl class="rs-metrics rs-device-stats">
          <div
            v-for="([label, value], index) in deviceStats"
            :key="label"
            :data-compact="[0, 1, 2, 9, 10, 11].includes(index) || undefined"
          >
            <dt>{{ label }}</dt>
            <dd>{{ value }}</dd>
          </div>
        </dl>
      </section>
      <section class="android-card rs-neighbors" :data-pci="radioNeighbors[currentNeighbor]!.pci">
        <header class="android-card-heading"><h3>邻区显示</h3></header>
        <p>{{ panels ? 'LTE B8 · ARFCN 3740' : '点击条目可确认锁小区' }}</p>
        <ul class="rs-neighbor-list">
          <li
            v-for="(cell, index) in radioNeighbors"
            :key="cell.pci"
            :data-current="index === currentNeighbor"
          >
            <div>
              <strong>{{ cell.band }}</strong
              ><span
                >ARFCN <b>{{ cell.arfcn }}</b></span
              ><span
                >PCI <b>{{ cell.pci }}/{{ Number(cell.pci) % 3 }}</b></span
              ><b class="rs-overflow">···</b>
            </div>
            <div>
              <span
                >RSRP <b :data-quality="level('RSRP', Number(cell.rsrp))">{{ cell.rsrp }}</b></span
              ><span
                >RSRQ <b :data-quality="level('RSRQ', Number(cell.rsrq))">{{ cell.rsrq }}</b></span
              ><span>SINR <b>--</b></span>
            </div>
          </li>
        </ul>
      </section>
    </template>

    <template v-else-if="scene === 'lock'">
      <ul class="rs-lock-tabs">
        <li v-for="(tab, index) in lockTabs" :key="tab" :data-current="index === 1">{{ tab }}</li>
      </ul>
      <section class="android-card rs-lock" :data-role="secondaryRole ? 'Scell' : 'Pcell+Scell'">
        <header class="android-card-heading"><h3>频段角色</h3></header>
        <div class="rs-roles">
          <span :data-current="!secondaryRole">Pcell+Scell</span>
          <span :data-current="secondaryRole">Scell</span>
        </div>
        <p>
          {{ secondaryRole ? '选择仅作为辅小区使用的频段' : '选择可作为主小区或辅小区使用的频段' }}
        </p>
        <section v-for="(options, group) in bandGroups" :key="group" class="rs-band-group">
          <h4>{{ group }} 频段</h4>
          <ul class="rs-band-grid">
            <li v-for="band in options" :key="band" :data-selected="band === selectedBand">
              <SiteIcon v-if="band === selectedBand" name="check" :size="13" />{{ band }}
            </li>
          </ul>
        </section>
      </section>
      <div v-if="!panels" class="rs-lock-actions">
        <span :data-applying="applying">{{ applying ? '处理中' : '应用' }}</span
        ><span>清空</span>
      </div>
      <p v-if="panels || applied" class="rs-lock-result" :data-applied="applied">
        <SiteIcon :name="applied ? 'check' : 'lock'" :size="14" />
        {{ applied ? '锁频段 成功' : applying ? '处理中' : '频段配置' }}
      </p>
    </template>

    <template v-else-if="scene === 'tests'">
      <h3 class="rs-page-title">测试</h3>
      <section class="android-card rs-test-menu">
        <header class="android-card-heading"><h3>网络诊断</h3></header>
        <ul class="rs-list">
          <li
            v-for="[title, status, icon] in tests"
            :key="title"
            :data-current="title === '测速' && progress > 0.45"
          >
            <SiteIcon :name="icon" :size="17" /><b>{{ title }}</b
            ><span>{{ status }}</span
            ><SiteIcon class="rs-row-chevron" name="chevron" :size="12" />
          </li>
        </ul>
      </section>
    </template>

    <template v-else-if="!settingsDetail">
      <h3 class="rs-page-title">设置</h3>
      <section class="android-card rs-setting-home">
        <header class="android-card-heading"><h3>设备</h3></header>
        <div><b>华为</b><span>已登录</span></div>
      </section>
      <section class="android-card rs-setting-home">
        <header class="android-card-heading"><h3>个性化</h3></header>
        <ul class="rs-list">
          <li>
            <SiteIcon name="sliders" :size="17" /><b>展示设置</b
            ><SiteIcon class="rs-row-chevron" name="chevron" :size="12" />
          </li>
          <li data-current="true">
            <SiteIcon name="settings" :size="17" /><b>界面风格</b
            ><SiteIcon class="rs-row-chevron" name="chevron" :size="12" />
          </li>
        </ul>
      </section>
    </template>

    <div v-else class="rs-appearance">
      <section class="android-card rs-theme-mode">
        <h3>颜色模式</h3>
        <span
          >{{ styleLight ? '浅色模式' : '跟随系统' }} <SiteIcon name="chevron" :size="13"
        /></span>
        <p>{{ styleLight ? '始终使用浅色外观' : '根据系统的深色模式设置自动切换' }}</p>
      </section>
      <section class="android-card rs-wallpaper">
        <header class="android-card-heading"><h3>页面壁纸</h3></header>
        <div class="rs-wallpaper-preview">
          <i><SiteIcon name="wallpaper" :size="26" /></i><span>选择图片</span>
        </div>
      </section>
      <section class="android-card rs-theme-mode">
        <h3>底部导航栏样式</h3>
        <span>液态玻璃 <SiteIcon name="chevron" :size="13" /></span>
        <p>支持饱和度增强、模糊与透镜折射</p>
      </section>
      <section class="android-card rs-style-card">
        <header class="android-card-heading"><h3>卡片外观</h3></header>
        <div><span>卡片模糊</span><i></i></div>
      </section>
    </div>
  </div>
</template>
