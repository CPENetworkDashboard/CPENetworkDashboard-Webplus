<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import type { SceneId } from './film'
import ProductExplorer from '../ProductExplorer.vue'
const RadioScene = defineAsyncComponent(() => import('./RadioScene.vue'))
const SpectrumScene = defineAsyncComponent(() => import('./SpectrumScene.vue'))
defineProps<{ scene: SceneId; progress: number }>()
</script>
<template>
  <ProductExplorer
    v-if="scene === 'desktop-connect' || scene === 'desktop-lock' || scene === 'desktop-test'"
    :scene
    :progress
  />
  <SpectrumScene v-else-if="scene === 'speed' || scene === 'wifi'" :scene :progress />
  <RadioScene v-else :scene :progress />
</template>
