<script setup lang="ts">
const stats = [
  ['设备型号', 'H153-381'],
  ['WLAN接入', '1'],
  ['当日流量', '54.22 MB'],
  ['软件版本', 'H6623SP2C233'],
  ['上次清空日期', '2026-11-16'],
  ['累计连接', '4天 1时 31分'],
  ['本月下载', '9.41 GB'],
  ['本月上传', '931.59 MB'],
  ['本次连接', '0天 0时 1分'],
] as const

const neighbors = [
  { band: 'B8', arfcn: '3740', pci: '42/0', rsrp: '-104', rsrq: '-12', sinr: '--' },
  { band: 'B8', arfcn: '3740', pci: '265/1', rsrp: '-109', rsrq: '-18', sinr: '--' },
  { band: 'B8', arfcn: '3740', pci: '73/1', rsrp: '-109', rsrq: '-18', sinr: '--' },
] as const
</script>

<template>
  <section class="pm-card pm-device-info">
    <h4>设备信息</h4>
    <div class="pm-device-grid">
      <div v-for="[label, value] in stats" :key="label">
        <span>{{ label }}</span
        ><strong>{{ value }}</strong>
      </div>
    </div>
  </section>
  <section class="pm-card pm-neighbor-card">
    <header>
      <div>
        <h4>邻区显示</h4>
        <p>点击条目可确认锁小区</p>
      </div>
      <span>3 个</span>
    </header>
    <div class="pm-neighbor-list">
      <div v-for="cell in neighbors" :key="cell.pci" class="pm-neighbor-row">
        <div>
          <strong>{{ cell.band }}</strong>
          <span><small>ARFCN</small>{{ cell.arfcn }}</span>
          <span><small>PCI</small>{{ cell.pci }}</span>
          <i aria-hidden="true">•••</i>
        </div>
        <div>
          <span
            ><small>RSRP</small><b class="poor">{{ cell.rsrp }}</b></span
          >
          <span
            ><small>RSRQ</small
            ><b :class="{ poor: Number(cell.rsrq) <= -18 }">{{ cell.rsrq }}</b></span
          >
          <span
            ><small>SINR</small><b>{{ cell.sinr }}</b></span
          >
        </div>
      </div>
    </div>
  </section>
</template>
