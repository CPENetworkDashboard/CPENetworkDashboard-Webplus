<script setup lang="ts">
import { computed, toRef } from 'vue'
import SiteIcon from '@/components/SiteIcon.vue'
import { pop, span } from './quality'

const props = defineProps<{ t: number; on?: boolean; mode: 'screen' | 'stage' }>()
const t = toRef(props, 't')
const phase = computed(() => {
  const v = t.value
  return v < 0.34 ? 0 : v < 0.44 ? 1 : v < 0.54 ? 2 : v < 0.7 ? 3 : 4
})
const lteBands = ['B1', 'B3', 'B5', 'B7', 'B8', 'B20', 'B28', 'B38', 'B40', 'B41', 'B42', 'B43']
const nrBands = ['N1', 'N3', 'N5', 'N7', 'N8', 'N20', 'N28', 'N38', 'N40', 'N41', 'N77', 'N78']
const selected = computed(() => new Set(phase.value >= 1 ? ['B8', 'N78'] : ['B8']))
const statusBadge = computed(() =>
  phase.value === 4
    ? { cls: 'ok', text: '回读一致' }
    : phase.value === 3
      ? { cls: 'busy', text: '重新注册中' }
      : phase.value === 2
        ? { cls: 'busy', text: '正在写入' }
        : phase.value === 1
          ? { cls: 'ready', text: '待应用 · N78' }
          : { cls: 'idle', text: '未锁定' }
)
const cardShow = computed(() => pop(span(t.value, 0.44, 0.56)))
</script>

<template>
  <template v-if="mode === 'screen'">
    <div
      class="pm-card pm-band-config"
      :class="{ glow: phase === 2 || phase === 3, 'glow-ok': phase === 4 }"
    >
      <div class="pm-card-head">
        <h4>频段角色</h4>
        <span v-if="phase > 0" class="pm-status-pill" :class="statusBadge.cls">
          <i v-if="phase === 2 || phase === 3" class="am-spin"></i>
          <SiteIcon v-else-if="phase === 4" name="check" :size="13" />
          {{ statusBadge.text }}
        </span>
      </div>
      <div class="pm-band-role"><span class="on">Pcell+Scell</span><span>Scell</span></div>
      <p class="pm-band-help">选择可作为主小区或辅小区使用的频段</p>
      <div class="pm-band-group">
        <h5>LTE 频段</h5>
        <div class="pm-band-grid">
          <span v-for="band in lteBands" :key="band" :class="{ on: selected.has(band) }"
            ><i v-if="selected.has(band)"></i>{{ band }}</span
          >
        </div>
      </div>
      <div class="pm-band-group">
        <h5>NR 频段</h5>
        <div class="pm-band-grid">
          <span
            v-for="band in nrBands"
            :key="band"
            :class="{ on: selected.has(band), locked: band === 'N78' && phase === 4 }"
            ><i v-if="selected.has(band)"></i>{{ band }}</span
          >
        </div>
      </div>
    </div>
    <div class="pm-actions">
      <span class="fill" :class="{ pressed: phase === 2 }">应用</span
      ><span class="danger">清空</span>
    </div>
  </template>

  <div v-else class="story-layer" :class="{ on }" aria-hidden="true">
    <div
      v-if="phase >= 2"
      class="story-lock-card"
      :class="{ ok: phase === 4 }"
      :style="{ '--c': cardShow }"
    >
      <div class="story-lock-eyebrow">
        <i v-if="phase < 4" class="am-spin"></i>
        <SiteIcon v-else name="check" :size="15" />
        <span>{{
          phase === 2 ? '正在写入锁频配置' : phase === 3 ? '设备重新注册中' : '回读校验通过'
        }}</span>
      </div>
      <div class="story-lock-band">
        <strong>N78</strong>
        <span>3.5 GHz · SA</span>
      </div>
      <small>{{
        phase === 4 ? '回读 NR bands=78，与设置一致' : '下发 NR Band 78 锁定指令并驻留'
      }}</small>
    </div>
  </div>
</template>
