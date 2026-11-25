<script setup lang="ts">
import { nextTick, onDeactivated, onMounted, ref, useId } from 'vue'
import type { CellTarget } from '@/androidTour'
import { deviceStats as stats, radioNeighbors } from '@/data/androidPreview'
import '@/styles/android-radio.css'

const emit = defineEmits<{ lock: [target: CellTarget] }>()
const root = ref<HTMLElement>()
const confirmationId = useId()
const selected = ref<CellTarget>()
const pending = ref<CellTarget>()
let trigger: HTMLButtonElement | null = null

async function pick(cell: CellTarget, event: MouseEvent) {
  trigger = event.currentTarget as HTMLButtonElement
  pending.value = cell
  await nextTick()
  root.value?.querySelector<HTMLButtonElement>('[data-neighbor-cancel]')?.focus()
}

function dismiss() {
  pending.value = undefined
  trigger?.focus({ preventScroll: true })
}

function confirm() {
  if (!pending.value) return
  const { band, arfcn, pci } = pending.value
  selected.value = { band, arfcn, pci }
  dismiss()
  emit('lock', { band, arfcn, pci })
}

onMounted(() => {
  // The scrolling story also mounts this panel inside a decorative, aria-hidden phone.
  if (root.value?.closest('[aria-hidden="true"]')) root.value.inert = true
})
onDeactivated(() => {
  pending.value = undefined
})
</script>

<template>
  <div ref="root" class="android-radio" data-radio-page="neighbors">
    <section class="ar-card" aria-label="设备信息">
      <h3>设备信息</h3>
      <dl class="ar-stats">
        <div v-for="[label, value] in stats" :key="label" :data-device-field="label">
          <dt>{{ label }}</dt>
          <dd>{{ value }}</dd>
        </div>
      </dl>
    </section>

    <section class="ar-card" aria-label="邻区显示">
      <h3>邻区显示</h3>
      <p class="ar-hint" role="status" data-neighbor-selection>
        {{
          selected
            ? '当前选择 · ' + selected.band + ' / PCI ' + selected.pci
            : '点击条目可确认锁小区'
        }}
      </p>
      <div class="ar-neighbor-list">
        <div v-for="cell in radioNeighbors" :key="cell.pci" class="ar-neighbor-item">
          <button
            type="button"
            class="ar-neighbor"
            :data-neighbor="cell.pci"
            :aria-pressed="selected?.pci === cell.pci"
            :aria-expanded="pending?.pci === cell.pci"
            :aria-controls="pending?.pci === cell.pci ? confirmationId : undefined"
            @click="pick(cell, $event)"
          >
            <strong>{{ cell.band }}</strong>
            <span><small>ARFCN</small> {{ cell.arfcn }}</span>
            <span><small>PCI</small> {{ cell.pci }}/{{ Number(cell.pci) % 3 }}</span>
            <i class="ar-row-mark" aria-hidden="true">{{
              selected?.pci === cell.pci ? '✓' : '···'
            }}</i>
            <span
              ><small>RSRP</small> <b class="ar-weak">{{ cell.rsrp }}</b></span
            >
            <span
              ><small>RSRQ</small>
              <b :class="Number(cell.rsrq) <= -18 ? 'ar-weak' : 'ar-good'">{{ cell.rsrq }}</b></span
            >
            <span><small>SINR</small> --</span>
          </button>
          <div
            v-if="pending?.pci === cell.pci"
            :id="confirmationId"
            class="ar-confirm"
            role="group"
            aria-label="确认锁小区"
            data-neighbor-prompt
            @keydown.esc.stop.prevent="dismiss"
          >
            <strong>确认锁小区</strong>
            <p>{{ cell.band }} · ARFCN {{ cell.arfcn }} · PCI {{ cell.pci }}</p>
            <div class="ar-pair">
              <button type="button" data-neighbor-cancel @click="dismiss">取消</button>
              <button type="button" class="ar-primary" data-neighbor-confirm @click="confirm">
                确认
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
