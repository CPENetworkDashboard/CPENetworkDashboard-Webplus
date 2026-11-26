<script setup lang="ts">
import { computed } from 'vue'
import AndroidGlyph from './AndroidGlyph.vue'
import '@/styles/android-handset.css'

type Section = 'connect' | 'lock' | 'test' | 'settings'
const props = defineProps<{
  section: Section
  shot: string
  title?: string
  light?: boolean
}>()
const tabs = [
  ['connect', '连接'],
  ['lock', '锁频'],
  ['test', '测试'],
  ['settings', '设置'],
] as const
const selected = computed(() => tabs.findIndex(([section]) => section === props.section))
</script>

<template>
  <div class="android-shot" aria-hidden="true">
    <div class="android-handset" :class="{ 'android-handset-light': light }">
      <div class="android-display">
        <div class="android-status-line">
          <span class="android-time">09:41</span>
          <div class="android-status-icons">
            <span class="android-network-type">5G</span>
            <AndroidGlyph name="signal" />
            <AndroidGlyph name="wifi" />
            <AndroidGlyph name="battery" class="android-battery" />
          </div>
        </div>
        <div v-if="title" class="android-detail-bar">
          <span class="android-back"><AndroidGlyph name="back" /></span><span>{{ title }}</span>
        </div>
        <div :key="shot + (title ?? '')" class="android-screen"><slot /></div>
        <div v-if="!title" class="android-dock" :style="{ '--dock-index': selected }">
          <i class="android-dock-lens"></i>
          <span v-for="[key, label] in tabs" :key="key" :data-current="section === key">
            <AndroidGlyph :name="key" :selected="section === key" />{{ label }}
          </span>
        </div>
        <i class="android-gesture"></i>
      </div>
    </div>
  </div>
</template>
