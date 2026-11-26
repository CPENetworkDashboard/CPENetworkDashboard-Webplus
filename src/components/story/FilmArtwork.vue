<script setup lang="ts">
import { computed } from 'vue'
import type { SceneId } from './film'
import AndroidHandset from './AndroidHandset.vue'
import ProductExplorer from '../ProductExplorer.vue'
import RadioScene from './RadioScene.vue'
import SpectrumScene from './SpectrumScene.vue'

const props = defineProps<{ scene: SceneId; progress: number }>()
const settingsDetail = computed(() => props.scene === 'settings' && props.progress >= 0.24)
const detailTitle = computed(() => {
  if (props.scene === 'speed') return '测速'
  if (props.scene === 'wifi') return 'Wi-Fi 信道'
  if (settingsDetail.value) return '界面风格'
  return undefined
})
const section = computed(() => {
  if (props.scene === 'lock' || props.scene === 'settings') return props.scene
  if (props.scene === 'tests' || props.scene === 'speed' || props.scene === 'wifi') return 'test'
  return 'connect'
})
</script>

<template>
  <ProductExplorer
    v-if="scene === 'desktop-connect' || scene === 'desktop-lock' || scene === 'desktop-test'"
    :scene
    :progress
  />
  <AndroidHandset
    v-else
    :section
    :shot="scene"
    :title="detailTitle"
    :light="scene === 'speed' || (scene === 'settings' && progress >= 0.56)"
  >
    <SpectrumScene v-if="scene === 'speed' || scene === 'wifi'" :scene :progress />
    <RadioScene v-else :scene :progress />
  </AndroidHandset>
</template>
