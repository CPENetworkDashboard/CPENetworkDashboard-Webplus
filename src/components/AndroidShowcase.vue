<script setup lang="ts">
import { computed } from 'vue'
import { androidFeature, androidFeatures, type AndroidView } from '@/androidTour'
import AndroidApp from './AndroidApp.vue'
import SiteIcon from './SiteIcon.vue'
const props = defineProps<{ view: AndroidView }>()
const emit = defineEmits<{ select: [view: AndroidView] }>()
const current = computed(() => androidFeature(props.view))
</script>
<template>
  <section class="android-showcase" aria-label="Android 交互演示">
    <div class="tour-context">
      <div :key="current.id" class="tour-prose">
        <h2>{{ current.title }}</h2>
        <p>{{ current.copy }}</p>
      </div>
      <div class="tour-choices" role="group" aria-label="选择演示功能">
        <button
          v-for="item in androidFeatures"
          :key="item.id"
          type="button"
          :data-preview="item.id"
          :aria-pressed="view === item.id"
          @click="emit('select', item.id)"
        >
          <SiteIcon :name="item.icon" :size="18" />{{ item.label }}
        </button>
      </div>
      <p class="demo-notice">可直接操作 · 使用示例设备数据</p>
    </div>
    <div class="tour-stage"><AndroidApp :view @select="emit('select', $event)" /></div>
  </section>
</template>
