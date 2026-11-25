<script setup lang="ts">
import { computed } from 'vue'
import SiteIcon from '../SiteIcon.vue'
import { span } from './quality'
import '@/styles/android-handset.css'

type Section = 'connect' | 'lock' | 'test' | 'settings'
const props = defineProps<{
  section: Section
  shot: string
  title?: string
  light?: boolean
  progress: number
  hero?: boolean
}>()
const tabs = [
  ['connect', '连接', 'home'],
  ['lock', '锁频', 'lock'],
  ['test', '测试', 'timer'],
  ['settings', '设置', 'settings'],
] as const
const selected = computed(() => tabs.findIndex(([section]) => section === props.section))
function easeInOut(value: number) {
  return value * value * (3 - 2 * value)
}
const camera = computed(() => {
  if (!props.hero) return undefined
  const t = easeInOut(span(props.progress, 0, 0.78))
  const lift =
    easeInOut(span(props.progress, 0.08, 0.34)) * (1 - easeInOut(span(props.progress, 0.4, 0.76)))
  return {
    '--app-yaw': -24 * (1 - t) + 'deg',
    '--app-pitch': 7 * (1 - t) + 'deg',
    '--app-roll': -5 * (1 - t) + 'deg',
    '--app-zoom': 0.91 + 0.09 * t,
    '--app-lift': lift,
  }
})
</script>

<template>
  <div class="android-shot" :class="{ 'android-shot-hero': hero }" aria-hidden="true">
    <div class="android-handset" :class="{ 'android-handset-light': light }" :style="camera">
      <div class="android-status-line">
        <span>09:41</span>
        <div class="android-status-icons">
          <span>5G</span><SiteIcon name="signal" :size="13" /><SiteIcon name="wifi" :size="13" />
          <i class="android-battery">83</i>
        </div>
      </div>
      <div v-if="title" class="android-detail-bar">
        <SiteIcon name="back" :size="18" /><span>{{ title }}</span>
      </div>
      <div :key="shot + (title ?? '')" class="android-screen"><slot /></div>
      <div v-if="!title" class="android-dock" :style="{ '--dock-index': selected }">
        <i class="android-dock-lens"></i>
        <span v-for="[key, label, icon] in tabs" :key="key" :data-current="section === key">
          <SiteIcon :name="icon" :size="18" />{{ label }}
        </span>
      </div>
      <i class="android-gesture"></i>
    </div>
  </div>
</template>
