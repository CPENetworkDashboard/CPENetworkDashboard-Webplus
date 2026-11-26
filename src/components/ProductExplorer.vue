<script setup lang="ts">
import { computed } from 'vue'
import SiteIcon from './SiteIcon.vue'
import { clamp, span } from './story/quality'

type DesktopScene = 'desktop-connect' | 'desktop-lock' | 'desktop-test'
const props = defineProps<{ scene: DesktopScene; progress: number }>()
const frame = computed(() => clamp(Number.isFinite(props.progress) ? props.progress : 0))

// Every pose is sampled from the host's playhead, including reverse seeks.
function cue(start: number, end: number) {
  const t = span(frame.value, start, end)
  return t * t * (3 - 2 * t)
}
const radioProgress = computed(() => ({
  '--signal-focus': cue(0.06, 0.38) * (1 - cue(0.55, 0.95)),
  '--signal-fill': 0.34 + 0.66 * cue(0, 0.63),
}))
const bandSelected = computed(() => frame.value >= 0.32)
const readback = computed(() => frame.value >= 0.72)
const bands = ['B1', 'B3', 'B5', 'B7', 'B8', 'B20']
const sections = [
  { scene: 'desktop-connect', label: '连接', icon: 'signal' },
  { scene: 'desktop-lock', label: '锁频', icon: 'lock' },
  { scene: 'desktop-test', label: '测试', icon: 'activity' },
] as const
const descriptions: Record<DesktopScene, string> = {
  'desktop-connect': '桌面连接看板示例。RSRP 为 −66 dBm，SINR 为 22 dB，RSRQ 为 −10 dB。',
  'desktop-lock': '桌面锁频示例。选择 LTE B8 后，设备回读 B8，与目标一致。',
  'desktop-test': '桌面 Ping 示例。10 次采样，平均 24.1 ms，最低 20.8 ms，最高 30.0 ms。',
}

// A ten-reply example matching the range and mean of the desktop Ping view.
const pings = [30, 21.4, 28, 20.8, 24.2, 24.7, 22.1, 22.2, 24.1, 23.5]
const trace = pings
  .map((ms, i) => (i ? 'L' : 'M') + (4 + i * 32) + ',' + (56 - (ms - 20) * 4.5))
  .join(' ')
const traceRemaining = computed(() => 1 - cue(0.07, 0.93))
</script>

<template>
  <div
    class="desktop-reel"
    data-testid="desktop-board"
    :data-scene="scene"
    :data-progress="frame"
    :data-held="frame === 1"
    role="img"
    :aria-label="descriptions[scene]"
  >
    <div class="reel-window" data-part="window" aria-hidden="true">
      <div class="reel-titlebar">
        <span class="reel-lights"><i></i><i></i><i></i></span>
        <strong>CPE网络看板</strong><small>示例设备</small>
      </div>
      <div class="reel-body">
        <div class="reel-sidebar">
          <span class="reel-connected"><i></i><span>已连接</span></span>
          <div class="reel-side-items">
            <span v-for="item in sections" :key="item.scene" :data-active="scene === item.scene">
              <SiteIcon :name="item.icon" :size="16" /><span>{{ item.label }}</span>
            </span>
          </div>
          <small>自动刷新</small>
        </div>
        <div v-if="scene === 'desktop-connect'" class="reel-work">
          <div class="reel-panel-head"><strong>射频质量</strong><small>连接看板</small></div>
          <div class="reel-radio-grid" :style="radioProgress">
            <div class="reel-signal" data-layer="signal">
              <div class="reel-label">RSRP <small>参考功率</small></div>
              <div class="reel-number">−66 <small>dBm</small></div>
              <i class="reel-meter"><i></i></i>
            </div>
            <div class="reel-reading" data-layer="quality">
              <span>SINR</span><b>22 <small>dB</small></b>
            </div>
            <div class="reel-reading" data-layer="quality">
              <span>RSRQ</span><b>−10 <small>dB</small></b>
            </div>
          </div>
          <div class="reel-strip">
            <span>下行带宽 <b>100 MHz</b></span
            ><span>上行带宽 <b>100 MHz</b></span>
          </div>
        </div>
        <div v-else-if="scene === 'desktop-lock'" class="reel-work">
          <div class="reel-panel-head"><strong>锁频段</strong><small>LTE</small></div>
          <div class="reel-band-panel">
            <div class="reel-label">LTE 频段</div>
            <div class="reel-bands">
              <span
                v-for="band in bands"
                :key="band"
                :data-band="band"
                :data-selected="band === 'B8' && bandSelected"
                >{{ band }}</span
              >
            </div>
          </div>
          <div class="reel-lock-record">
            <div class="reel-record" :data-ready="bandSelected">
              <small>写入目标</small><b><span>B8</span></b>
            </div>
            <div class="reel-record" data-part="readback" :data-ready="readback">
              <small>设备回读</small
              ><b
                ><span>B8 <SiteIcon name="check" :size="16" /></span
              ></b>
            </div>
          </div>
        </div>
        <div v-else class="reel-work">
          <div class="reel-panel-head">
            <strong>Ping 延迟走势</strong><small>{{ pings.length }} 点</small>
          </div>
          <div class="reel-ping-panel">
            <div class="reel-label">
              平均延迟 <b>24.1 <small>ms</small></b>
            </div>
            <svg class="reel-plot" viewBox="0 0 296 64" preserveAspectRatio="none">
              <path class="reel-guides" d="M0 10H296 M0 33H296 M0 56H296" />
              <path
                class="reel-trace"
                data-part="ping-trace"
                :d="trace"
                pathLength="1"
                stroke-dasharray="1"
                :stroke-dashoffset="traceRemaining"
              />
            </svg>
          </div>
          <div class="reel-strip">
            <span>最短 <b>20.8 ms</b></span
            ><span>最长 <b>30.0 ms</b></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped src="../styles/desktop-reel.css"></style>
