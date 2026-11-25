<script setup lang="ts">
import { computed, toRef } from 'vue'
import PhoneConnect from './PhoneConnect.vue'
import PhoneNeighbors from './PhoneNeighbors.vue'
import { powerAt, radioAt } from './data'
import { ease, pop, span } from './quality'

const props = defineProps<{ t: number }>()
const t = toRef(props, 't')
const step = computed(() => (t.value < 0.18 ? 0 : t.value < 0.48 ? 1 : t.value < 0.8 ? 2 : 3))
const fill = computed(() => ease(span(t.value, 0.06, 0.46)))
const radio = computed(() => radioAt(fill.value))
const power = computed(() => powerAt(ease(span(t.value, 0.16, 0.5))))
const lift = computed(() => pop(span(t.value, 0.46, 0.62)) * (1 - ease(span(t.value, 0.7, 0.78))))
const grades = computed(() => pop(span(t.value, 0.58, 0.72)))
</script>

<template>
  <Transition name="phone-screen-switch" mode="out-in">
    <PhoneNeighbors v-if="step === 3" key="neighbors" />
    <PhoneConnect
      v-else
      key="connection"
      :radio
      :power
      :fill
      :focus="step === 0 ? 'cell' : step === 2 ? 'radio' : null"
      :pop="lift"
      :grades
    />
  </Transition>
</template>
