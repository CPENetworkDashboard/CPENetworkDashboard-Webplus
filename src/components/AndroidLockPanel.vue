<script setup lang="ts">
import { computed, nextTick, onDeactivated, reactive, ref, useId, watch } from 'vue'
import type { CellTarget } from '@/androidTour'
import { radioNeighbors } from '@/data/androidPreview'

const props = defineProps<{ target?: CellTarget }>()
const tabs = { network: '网络首选', bands: '锁频段', arfcn: '锁频点', cell: '锁小区' } as const
type Tab = keyof typeof tabs
type EntryTab = 'arfcn' | 'cell'
type Role = 'Pcell+Scell' | 'Scell'
type Rat = 'LTE' | 'NR'
const roles: Role[] = ['Pcell+Scell', 'Scell']
const rats: Rat[] = ['NR', 'LTE']
const bands = {
  LTE: ['B1', 'B3', 'B5', 'B7', 'B8', 'B20', 'B28', 'B38', 'B40', 'B41', 'B42', 'B43'],
  NR: ['N1', 'N3', 'N5', 'N7', 'N8', 'N20', 'N28', 'N38', 'N40', 'N41', 'N77', 'N78'],
}
const modes = ['自动（SA+NSA）', '自动（仅SA）', '自动（仅NSA）', '仅5G', '仅4G'] as const

const tab = ref<Tab>('bands')
const root = ref<HTMLElement>()
const panelId = useId()
const role = ref<Role>('Pcell+Scell')
const bandDrafts = reactive<Record<Role, string[]>>({ 'Pcell+Scell': ['B8'], Scell: [] })
const savedBands = reactive<Record<Role, string[]>>({ 'Pcell+Scell': ['B8'], Scell: [] })
const networkMode = ref<string>(modes[0])
const modeDraft = ref(networkMode.value)
const pending = ref<'apply' | 'clear' | 'mode' | null>(null)
const feedback = ref('')

const blankForm = (): CellTarget => ({ band: 'B8', arfcn: '', pci: '' })
const forms = reactive({ arfcn: blankForm(), cell: blankForm() })
const drafts = reactive<Record<EntryTab, CellTarget[]>>({ arfcn: [], cell: [] })
const saved = reactive<Record<EntryTab, CellTarget[]>>({ arfcn: [], cell: [] })
const entryTab = computed<EntryTab>(() => (tab.value === 'cell' ? 'cell' : 'arfcn'))
const form = computed(() => forms[entryTab.value])
const rat = computed<Rat>(() => (form.value.band.startsWith('N') ? 'NR' : 'LTE'))
const formError = ref('')

function keyOf(entry: CellTarget) {
  return [entry.band, entry.arfcn, entry.pci].join('/')
}
function entryLabel(entry: CellTarget) {
  const freq = entry.band + ' · ARFCN ' + entry.arfcn
  return entry.pci ? freq + ' · PCI ' + entry.pci : freq
}
function dismiss() {
  pending.value = null
  modeDraft.value = networkMode.value
}
function switchTab(next: Tab) {
  tab.value = next
  feedback.value = ''
  formError.value = ''
  dismiss()
}
function tabKey(event: KeyboardEvent, current: Tab) {
  const keys = Object.keys(tabs) as Tab[]
  const index = keys.indexOf(current)
  const next = {
    ArrowRight: keys[(index + 1) % keys.length],
    ArrowLeft: keys[(index + keys.length - 1) % keys.length],
    Home: keys[0],
    End: keys[keys.length - 1],
  }[event.key]
  if (!next) return
  event.preventDefault()
  switchTab(next)
  root.value?.querySelector<HTMLButtonElement>('[data-lock-tab="' + next + '"]')?.focus()
}
function edit() {
  feedback.value = ''
  formError.value = ''
  dismiss()
}
function selectRole(name: Role) {
  role.value = name
  edit()
}
function readNetworkMode() {
  dismiss()
  feedback.value = '当前网络模式 · ' + networkMode.value
}
function toggleBand(band: string) {
  edit()
  const choices = bandDrafts[role.value]
  bandDrafts[role.value] = choices.includes(band)
    ? choices.filter((item) => item !== band)
    : [...choices, band]
}
function setRat(next: Rat) {
  if (rat.value === next) return
  edit()
  Object.assign(form.value, { band: next === 'LTE' ? 'B8' : 'N78', arfcn: '', pci: '' })
}
function fillExample() {
  edit()
  const sample =
    rat.value === 'LTE' ? radioNeighbors[0] : { band: 'N78', arfcn: '636666', pci: '221' }
  Object.assign(form.value, {
    band: sample.band,
    arfcn: sample.arfcn,
    pci: tab.value === 'cell' ? sample.pci : '',
  })
}
function isIntegerInRange(text: string, max: number) {
  return /^\d+$/.test(text.trim()) && Number(text) <= max
}
function addEntry() {
  edit()
  const { band, arfcn, pci } = form.value
  const maxArfcn = rat.value === 'LTE' ? 262143 : 3279165
  const maxPci = rat.value === 'LTE' ? 503 : 1007
  if (!isIntegerInRange(arfcn, maxArfcn)) {
    formError.value = 'ARFCN 范围 0–' + maxArfcn
    return
  }
  if (tab.value === 'cell' && !isIntegerInRange(pci, maxPci)) {
    formError.value = 'PCI 范围 0–' + maxPci
    return
  }
  const entry = {
    band,
    arfcn: String(Number(arfcn)),
    pci: tab.value === 'cell' ? String(Number(pci)) : '',
  }
  const list = drafts[entryTab.value]
  if (list.some((item) => keyOf(item) === keyOf(entry))) {
    formError.value = '该条目已添加'
    return
  }
  list.push(entry)
  form.value.arfcn = ''
  form.value.pci = ''
}
function removeEntry(index: number) {
  edit()
  drafts[entryTab.value].splice(index, 1)
}

// A quick lock carries the numeric PCI. Reopening a cached panel by itself must not replay it.
watch(
  () => props.target,
  (target) => {
    if (!target) return
    switchTab('cell')
    const entry = { band: target.band, arfcn: target.arfcn, pci: target.pci }
    Object.assign(forms.cell, entry)
    if (!drafts.cell.some((item) => keyOf(item) === keyOf(entry))) drafts.cell.push(entry)
    saved.cell = [{ ...entry }]
    feedback.value = '已选择邻区 · PCI ' + entry.pci
  },
  { immediate: true }
)

const canApply = computed(() =>
  tab.value === 'bands'
    ? roles.some((name) => bandDrafts[name].length > 0)
    : drafts[entryTab.value].length > 0
)
const applied = computed(() => {
  if (tab.value === 'bands') return savedBands[role.value].join('、')
  if (tab.value === 'network') return ''
  return saved[tab.value].map(entryLabel).join('；')
})
const confirmTitle = computed(() =>
  pending.value === 'clear'
    ? '确认清空锁频'
    : pending.value === 'mode'
      ? '确认切换网络模式'
      : '确认应用' + tabs[tab.value]
)
const confirmSummary = computed(() => {
  if (pending.value === 'clear') return '清空示例中的频段、频点和小区。'
  if (pending.value === 'mode') return modeDraft.value
  if (tab.value === 'bands')
    return roles.map((name) => name + ' · ' + (bandDrafts[name].join('、') || '无')).join('；')
  return drafts[entryTab.value].map(entryLabel).join('；')
})
let trigger: HTMLElement | undefined
async function review(action: 'apply' | 'clear' | 'mode', event: Event) {
  trigger = event.currentTarget as HTMLElement
  feedback.value = ''
  pending.value = action
  await nextTick()
  root.value?.querySelector<HTMLButtonElement>('[data-lock-cancel]')?.focus()
}
function closeReview() {
  dismiss()
  trigger?.focus({ preventScroll: true })
}
function commit() {
  if (pending.value === 'clear') {
    for (const name of roles) {
      bandDrafts[name] = []
      savedBands[name] = []
    }
    for (const name of ['arfcn', 'cell'] as const) {
      drafts[name] = []
      saved[name] = []
      Object.assign(forms[name], blankForm())
    }
    formError.value = ''
    feedback.value = '已清空示例锁定'
  } else if (pending.value === 'mode') {
    networkMode.value = modeDraft.value
    feedback.value = '已切换 · ' + networkMode.value
  } else if (pending.value === 'apply' && canApply.value) {
    if (tab.value === 'bands') {
      for (const name of roles) savedBands[name] = [...bandDrafts[name]]
    } else {
      saved[entryTab.value] = drafts[entryTab.value].map((entry) => ({ ...entry }))
    }
    feedback.value = '已应用到当前示例'
  }
  closeReview()
}
onDeactivated(dismiss)
</script>

<template>
  <div ref="root" class="android-radio" data-radio-page="lock">
    <div class="ar-tabs" role="tablist" aria-label="锁频">
      <button
        v-for="(name, id) in tabs"
        :id="panelId + '-' + id"
        :key="id"
        type="button"
        role="tab"
        :aria-controls="panelId"
        :aria-selected="tab === id"
        :tabindex="tab === id ? 0 : -1"
        :data-lock-tab="id"
        @click="switchTab(id)"
        @keydown="tabKey($event, id)"
      >
        {{ name }}
      </button>
    </div>
    <div
      :id="panelId"
      class="ar-panel"
      role="tabpanel"
      :aria-labelledby="panelId + '-' + tab"
      :data-lock-page="tab"
    >
      <section v-if="tab === 'bands'" class="ar-card">
        <h3>频段角色</h3>
        <div class="ar-pair" role="group" aria-label="频段角色">
          <button
            v-for="name in roles"
            :key="name"
            type="button"
            :aria-pressed="role === name"
            :data-lock-role="name"
            @click="selectRole(name)"
          >
            {{ name }}
          </button>
        </div>
        <p class="ar-hint">
          {{
            role === 'Scell' ? '选择仅作为辅小区使用的频段' : '选择可作为主小区或辅小区使用的频段'
          }}
        </p>
        <fieldset
          v-for="(options, family) in bands"
          :key="family"
          class="ar-band-group"
          :data-band-group="family"
        >
          <legend>{{ family }} 频段</legend>
          <div class="ar-band-grid">
            <label v-for="band in options" :key="band" class="ar-band">
              <input
                type="checkbox"
                :data-band="band"
                :checked="bandDrafts[role].includes(band)"
                @change="toggleBand(band)"
              />
              <span>{{ band }}</span>
            </label>
          </div>
        </fieldset>
      </section>

      <section v-else-if="tab === 'network'" class="ar-card">
        <h3>网络首选</h3>
        <label class="ar-field"
          >网络模式
          <select v-model="modeDraft" data-network-mode @change="review('mode', $event)">
            <option v-for="mode in modes" :key="mode">{{ mode }}</option>
          </select>
        </label>
      </section>

      <template v-else>
        <form :key="entryTab" class="ar-card" novalidate @submit.prevent="addEntry">
          <div class="ar-head">
            <h3>{{ tab === 'cell' ? '锁PCI' : '锁ARFCN' }}</h3>
            <button type="button" class="ar-text-button" data-lock-example @click="fillExample">
              填入示例
            </button>
          </div>
          <fieldset class="ar-fieldset">
            <legend>驻网</legend>
            <div class="ar-pair">
              <button
                v-for="family in rats"
                :key="family"
                type="button"
                :aria-pressed="rat === family"
                :data-lock-rat="family"
                @click="setRat(family)"
              >
                {{ family }}
              </button>
            </div>
          </fieldset>
          <label class="ar-field"
            >Band
            <select v-model="form.band" data-lock-band @change="edit">
              <option v-for="band in bands[rat]" :key="band">{{ band }}</option>
            </select>
          </label>
          <div class="ar-entry-fields">
            <label class="ar-field"
              >ARFCN
              <input
                v-model="form.arfcn"
                type="text"
                inputmode="numeric"
                autocomplete="off"
                data-lock-arfcn
                @input="edit"
              />
            </label>
            <label v-if="tab === 'cell'" class="ar-field"
              >PCI
              <input
                v-model="form.pci"
                type="text"
                inputmode="numeric"
                autocomplete="off"
                data-lock-pci
                @input="edit"
              />
            </label>
          </div>
          <p v-if="formError" class="ar-error" role="alert" data-lock-error>{{ formError }}</p>
          <button type="submit" class="ar-add" data-lock-add>添加</button>
        </form>
        <section v-if="drafts[entryTab].length" class="ar-card" aria-label="已添加条目">
          <h3>已添加 ({{ drafts[entryTab].length }})</h3>
          <ul class="ar-entries">
            <li
              v-for="(entry, index) in drafts[entryTab]"
              :key="keyOf(entry)"
              :data-lock-entry="keyOf(entry)"
            >
              <div>
                <strong>{{ entry.band.startsWith('N') ? 'NR' : 'LTE' }} · {{ entry.band }}</strong>
                <span
                  >ARFCN {{ entry.arfcn
                  }}<template v-if="entry.pci"> · PCI {{ entry.pci }}</template></span
                >
              </div>
              <button
                type="button"
                class="ar-text-button"
                :data-lock-remove="index"
                :aria-label="'删除 ' + entryLabel(entry)"
                @click="removeEntry(index)"
              >
                删除
              </button>
            </li>
          </ul>
        </section>
        <p v-else class="ar-empty">{{ tab === 'cell' ? '暂无已添加小区' : '暂无已添加频点' }}</p>
      </template>

      <div class="ar-actions">
        <button
          v-if="tab === 'network'"
          type="button"
          data-lock-action="read"
          @click="readNetworkMode"
        >
          读取
        </button>
        <button
          v-else
          type="button"
          class="ar-primary"
          data-lock-action="apply"
          :disabled="!canApply"
          @click="review('apply', $event)"
        >
          应用
        </button>
        <button
          type="button"
          class="ar-clear"
          data-lock-action="clear"
          @click="review('clear', $event)"
        >
          清空
        </button>
      </div>
      <div
        v-if="pending"
        class="ar-confirm"
        role="group"
        :aria-label="confirmTitle"
        :data-lock-prompt="pending"
        @keydown.esc.stop.prevent="closeReview"
      >
        <strong>{{ confirmTitle }}</strong>
        <p>{{ confirmSummary }}</p>
        <div class="ar-pair">
          <button type="button" data-lock-cancel @click="closeReview">取消</button>
          <button type="button" class="ar-primary" data-lock-confirm @click="commit">
            {{ pending === 'clear' ? '确认清空' : pending === 'apply' ? '确认应用' : '确认' }}
          </button>
        </div>
      </div>
      <p v-if="feedback" class="ar-feedback" role="status" data-lock-status>{{ feedback }}</p>
      <p v-if="applied" class="ar-readout" data-lock-applied><span>已应用</span> {{ applied }}</p>
    </div>
  </div>
</template>
