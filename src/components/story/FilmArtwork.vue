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
const orbitPath =
  'M658 165C680 245 514 390 343 435C180 479 37 443 22 373C3 293 162 148 337 99C502 53 637 90 658 165Z'
const camera = computed(() => {
  const position = props.progress
  const arc = span(position, 0.04, 0.78)
  const swing = arc > 0 && arc < 1 ? Math.sin(arc * Math.PI) : 0
  return {
    '--assembly': ease(span(position, 0.02, 0.82)),
    '--first': ease(span(position, 0.04, 0.4)),
    '--second': ease(span(position, 0.13, 0.63)),
    '--third': ease(span(position, 0.23, 0.78)),
    '--hero-swing': swing,
    '--orbit': arc,
    '--orbit-opacity': swing,
  }
})
</script>

<template>
  <div v-if="scene === 'connect'" class="hero-assembly" :style="camera">
    <svg class="hero-orbit" viewBox="0 0 680 520" preserveAspectRatio="none" aria-hidden="true">
      <path :d="orbitPath" />
      <path class="hero-orbit-light" pathLength="1" :d="orbitPath" />
    </svg>
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
