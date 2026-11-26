<script setup lang="ts">
import { computed } from 'vue'
import SiteIcon from '@/components/SiteIcon.vue'
import { useServiceStatus } from '@/composables/useServiceStatus'
import type { StatusDay } from '@/utils/status'

const {
  definitions,
  summary,
  results,
  daily,
  checking,
  error,
  state,
  latest,
  stale,
  available,
  ageSeconds,
  refresh,
} = useServiceStatus()

const descriptions: Record<string, string> = {
  website: '官网首页能否正常打开',
  health: '下载与接口所在的服务',
  releases: '可下载的版本信息',
}
const banner = computed(() => {
  if (error.value) return { state: 'unknown', title: '暂时无法读取服务状态' }
  if (!latest.value)
    return { state: 'unknown', title: checking.value ? '正在读取检查结果…' : '等待首次检查' }
  if (stale.value) return { state: 'unknown', title: '最近没有新的检查结果' }
  return {
    operational: { state: 'operational', title: '所有服务运行正常' },
    partial: { state: 'partial', title: '部分服务出现异常' },
    unavailable: { state: 'unavailable', title: '服务暂时不可用' },
    unknown: { state: 'unknown', title: '状态待确认' },
  }[state.value]
})
const ageLabel = computed(() => {
  const age = ageSeconds.value
  if (age === null || !Number.isFinite(age)) return ''
  if (age < 60) return '刚刚'
  if (age < 3600) return Math.floor(age / 60) + ' 分钟前'
  if (age < 86400) return Math.floor(age / 3600) + ' 小时前'
  return Math.floor(age / 86400) + ' 天前'
})
const rows = computed(() =>
  definitions.map((definition) => {
    const result = results.value.find((item) => item.id === definition.id)
    return {
      ...definition,
      icon: definition.platform
        ? { android: 'android', windows: 'windows', macos: 'apple' }[definition.platform]
        : definition.id === 'website'
          ? 'globe'
          : 'code',
      description: definition.platform
        ? '应用内检查更新'
        : descriptions[definition.id] || definition.description,
      state: stale.value || error.value ? 'unknown' : result?.state || 'unknown',
      availability: summary.value?.services[definition.id]?.availability,
    }
  })
)
function time(value?: string | null) {
  if (!value || !Number.isFinite(Date.parse(value))) return '—'
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value))
}
function percent(value?: number | null) {
  return value === null || value === undefined ? '—' : value.toFixed(2) + '%'
}
function dayState(day: StatusDay, id: string) {
  const metric = day.services[id]
  return !metric?.checks ? 'unknown' : metric.failed ? 'unavailable' : 'operational'
}
function dayLabel(day: StatusDay, id: string) {
  const metric = day.services[id]
  if (!metric?.checks) return day.date + '：没有检查记录'
  return (
    day.date +
    '：' +
    (metric.failed ? metric.failed + ' 次检查未通过' : '全部正常') +
    '，共 ' +
    metric.checks +
    ' 次检查'
  )
}
const stateLabel: Record<string, string> = {
  operational: '正常',
  unavailable: '异常',
  unknown: '待确认',
}
</script>

<template>
  <section class="st content-width" aria-labelledby="status-title">
    <header class="st-head">
      <div>
        <h1 id="status-title">服务状态</h1>
        <p>官网、下载和应用内更新是否正常。系统每 5 分钟自动检查一次。</p>
      </div>
      <button type="button" class="st-refresh" :disabled="checking" @click="refresh">
        <SiteIcon name="refresh" :size="16" />{{ checking ? '刷新中' : '刷新' }}
      </button>
    </header>

    <div class="st-banner" :data-state="banner.state" role="status">
      <span class="st-banner-icon" aria-hidden="true"
        ><SiteIcon :name="banner.state === 'operational' ? 'check' : 'info'" :size="22"
      /></span>
      <div>
        <h2>{{ banner.title }}</h2>
        <p v-if="latest">
          最近检查 <time :datetime="latest.at">{{ time(latest.at) }}</time
          ><template v-if="ageLabel">（{{ ageLabel }}）</template>
        </p>
        <p v-else-if="error">{{ error }}</p>
      </div>
      <strong v-if="latest && !stale && !error" class="st-count"
        >{{ available }}/{{ definitions.length }}<small>项正常</small></strong
      >
    </div>

    <ul class="st-list">
      <li v-for="row in rows" :key="row.id" :data-state="row.state">
        <div class="st-name">
          <span class="st-icon"><SiteIcon :name="row.icon" :size="18" /></span>
          <div>
            <h3>{{ row.name }}</h3>
            <p>{{ row.description }}</p>
          </div>
          <span class="st-pill"><i aria-hidden="true"></i>{{ stateLabel[row.state] }}</span>
        </div>
        <div
          class="st-days"
          role="img"
          :aria-label="row.name + '近 30 天可用率 ' + percent(row.availability)"
        >
          <i
            v-for="day in daily"
            :key="day.date"
            :data-state="dayState(day, row.id)"
            :title="dayLabel(day, row.id)"
          ></i>
        </div>
        <div class="st-axis">
          <span>30 天前</span><span>近 30 天可用率 {{ percent(row.availability) }}</span
          ><span>今天</span>
        </div>
      </li>
    </ul>

    <div class="st-summary">
      <div>
        <small>近 30 天可用率</small>
        <strong>{{ percent(summary?.totals.availability) }}</strong>
        <p>已检查的时段中，所有服务都正常的比例。</p>
      </div>
      <div>
        <small>检查覆盖率</small>
        <strong>{{ percent(summary?.totals.coverage) }}</strong>
        <p>实际完成的检查占计划检查的比例。没有检查记录的日子显示为灰色。</p>
      </div>
    </div>
    <p class="st-legend">
      <span><i data-state="operational"></i>正常</span
      ><span><i data-state="unavailable"></i>有异常</span
      ><span><i data-state="unknown"></i>无记录</span>
    </p>
  </section>
</template>
