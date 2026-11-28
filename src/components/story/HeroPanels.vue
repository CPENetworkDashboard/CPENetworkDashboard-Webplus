<script setup lang="ts">
import { computed } from 'vue'
import SiteIcon from '../SiteIcon.vue'
import { radioCarriers, words } from './data'
import { level, score } from './quality'

const props = defineProps<{ progress: number }>()
const carrier = computed(() => radioCarriers[props.progress < 0.55 ? 0 : 1])
const strength = computed(() => level('RSRP', carrier.value.rf[0]!)!)
</script>

<template>
  <div class="hero-panels">
    <section class="hero-panel hero-network" data-panel="operator">
      <span class="hero-panel-icon"><SiteIcon name="signal" :size="18" /></span>
      <div>
        <h3>中国移动</h3>
        <p class="hero-network-mode">5G SA</p>
      </div>
      <span class="hero-online"></span>
    </section>
    <section class="hero-panel hero-rf" data-panel="radio">
      <header>
        <h3>射频质量</h3>
        <span>{{ words[strength] }}</span>
      </header>
      <div class="hero-reading">
        <b>{{ carrier.rf[0] }}</b
        ><span>dBm</span>
      </div>
      <div class="hero-reading-scale">
        <span>RSRP</span>
        <i :style="{ '--fill': score[strength] }"></i>
      </div>
      <dl class="hero-metrics">
        <div>
          <dt>RSRQ</dt>
          <dd>{{ carrier.rf[1] }}<span> dB</span></dd>
        </div>
        <div>
          <dt>SINR</dt>
          <dd>{{ carrier.rf[2] }}<span> dB</span></dd>
        </div>
      </dl>
    </section>
    <section class="hero-panel hero-cell" data-panel="cell">
      <header>
        <h3>当前小区</h3>
      </header>
      <div class="hero-cell-band">
        <b>{{ carrier.values[0] }}</b
        ><span>{{ carrier.values[5] }}</span>
      </div>
      <dl class="hero-metrics">
        <div>
          <dt>ARFCN</dt>
          <dd>{{ carrier.values[1] }}</dd>
        </div>
        <div>
          <dt>PCI</dt>
          <dd>{{ carrier.values[2] }}</dd>
        </div>
      </dl>
    </section>
  </div>
</template>
