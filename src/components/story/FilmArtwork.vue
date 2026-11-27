<script setup lang="ts">
import { computed } from 'vue'
import type { SceneId } from './film'
import AndroidHandset from './AndroidHandset.vue'
import ProductExplorer from '../ProductExplorer.vue'
import RadioScene from './RadioScene.vue'
import SpectrumScene from './SpectrumScene.vue'
import HeroPanels from './HeroPanels.vue'
import { ease, span } from './quality'
import '@/styles/film-assembly.css'

const props = defineProps<{ scene: SceneId; progress: number }>()
const camera = computed(() => ({
  '--assembly': ease(span(props.progress, 0.02, 0.82)),
  '--first': ease(span(props.progress, 0.05, 0.37)),
  '--second': ease(span(props.progress, 0.15, 0.58)),
  '--third': ease(span(props.progress, 0.26, 0.76)),
}))
</script>

<template>
  <div v-if="scene === 'connect'" class="hero-assembly" :style="camera">
    <div class="hero-device">
      <AndroidHandset section="connect" shot="connect">
        <RadioScene scene="connect" :progress />
      </AndroidHandset>
    </div>
    <HeroPanels :progress />
  </div>
  <ProductExplorer
    v-else-if="scene === 'desktop-connect' || scene === 'desktop-lock' || scene === 'desktop-test'"
    class="film-desktop-assembly"
    :style="camera"
    :scene
    :progress
  />
  <div v-else class="film-assembly" :style="camera" :data-layout="scene">
    <SpectrumScene v-if="scene === 'speed' || scene === 'wifi'" :scene :progress />
    <RadioScene v-else :scene :progress panels />
  </div>
</template>
