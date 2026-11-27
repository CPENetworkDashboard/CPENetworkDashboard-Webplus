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
        <small>连接概览</small>
        <h3>中国移动 <span>5G SA</span></h3>
      </div>
      <span class="hero-online"></span>
    </section>
    <section class="hero-panel hero-rf" data-panel="radio">
      <header>
        <h3>射频质量</h3>
        <span>{{ carrier.label }}</span>
      </header>
      <div class="hero-reading">
        <b>{{ carrier.rf[0] }}</b
        ><span>dBm</span>
      </div>
      <div class="hero-reading-scale">
        <span>SS-RSRP</span><span>{{ words[strength] }}</span>
        <i :style="{ '--fill': score[strength] }"></i>
      </div>
      <dl class="hero-metrics">
        <div>
          <dt>SS-RSRQ</dt>
          <dd>{{ carrier.rf[1] }} <span>dB</span></dd>
        </div>
        <div>
          <dt>SS-SINR</dt>
          <dd>{{ carrier.rf[2] }} <span>dB</span></dd>
        </div>
      </dl>
    </section>
    <section class="hero-panel hero-cell" data-panel="cell">
      <header>
        <h3>当前小区</h3>
        <span>{{ carrier.label }}</span>
      </header>
      <dl class="hero-metrics">
        <div>
          <dt>频段</dt>
          <dd>{{ carrier.values[0] }}</dd>
        </div>
        <div>
          <dt>PCI</dt>
          <dd>{{ carrier.values[2] }}</dd>
        </div>
        <div>
          <dt>SSB-ARFCN</dt>
          <dd>{{ carrier.values[1] }}</dd>
        </div>
        <div>
          <dt>带宽</dt>
          <dd>{{ carrier.values[5] }}</dd>
        </div>
      </dl>
    </section>
  </div>
</template>
