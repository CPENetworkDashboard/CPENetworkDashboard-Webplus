import { level, mix, type Level } from './quality'

// Tile widths inside the 410px phone frame: 336px of card content.
export const W = { c2: 164, c3: 106.67, c4: 78 }

export const words: Record<Level, string> = {
  excellent: '极佳',
  good: '良好',
  fair: '一般',
  poor: '较弱',
  bad: '很弱',
}

export const cellFacts = [
  ['NR Band', 'N41'],
  ['SSB-ARFCN', '504990'],
  ['NR-PCI', '88'],
  ['gCellID', '12713469/2'],
  ['TAC', '1347599'],
  ['BW', '100 MHz'],
] as const

// [label, weak start, live value]
const radioSpec = [
  ['SS-RSRP', -121, -75],
  ['SS-RSRQ', -19, -10],
  ['SS-SINR', -4, 16],
  ['NR-RSSI', -96, -52],
  ['NR-CQI', 2, 12],
] as const
const powerSpec = [
  ['PUSCH', 4, 24],
  ['PUCCH', 6, -4],
  ['SRS', 6, 26],
  ['PRACH', 9, -2],
] as const

export interface Metric {
  label: string
  value: string
  level: Level | null
}
export function radioAt(r: number): Metric[] {
  return radioSpec.map(([label, from, to]) => {
    const value = Math.round(mix(from, to, r))
    return { label, value: String(value), level: level(label, value) }
  })
}
export function powerAt(r: number): Metric[] {
  return powerSpec.map(([label, from, to]) => {
    const value = Math.round(mix(from, to, r))
    return { label, value: `${value} dBm`, level: level(label, value) }
  })
}
export const finalRadio = radioAt(1)
export const finalPower = powerAt(1)

export const radioCarriers = [
  {
    label: 'NR PCC',
    type: 'P',
    values: cellFacts.map(([, value]) => value),
    rf: finalRadio.map((metric) => Number(metric.value)),
  },
  {
    label: 'NR SCC1',
    type: 'S',
    values: ['N78', '636666', '221', '', '', '80 MHz'],
    rf: [-87, -12, 21, -66, 14],
  },
] as const
