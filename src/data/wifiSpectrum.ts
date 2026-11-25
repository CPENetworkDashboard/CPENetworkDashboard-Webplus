export const bands = ['2.4', '5'] as const
export type Band = (typeof bands)[number]
interface AccessPoint {
  name: string
  channel: number
  level: number
  spread: number
}
interface Spectrum {
  ticks: number[]
  networks: AccessPoint[]
}

const spectrum: Record<Band, Spectrum> = {
  '2.4': {
    ticks: [1, 3, 5, 7, 9, 11, 13],
    networks: [
      { name: 'ChinaNet-7K', channel: 6, level: -48, spread: 2.3 },
      { name: 'TP-LINK_3B', channel: 11, level: -55, spread: 2.3 },
      { name: 'CMCC-A8F2', channel: 1, level: -71, spread: 2.3 },
    ],
  },
  '5': {
    ticks: [36, 64, 100, 132, 165],
    networks: [
      { name: 'HUAWEI-H168', channel: 44, level: -48, spread: 11 },
      { name: 'ChinaNet-7K', channel: 52, level: -57, spread: 11 },
      { name: 'CMCC-5G-A8F2', channel: 149, level: -63, spread: 10 },
    ],
  },
}

const colors = ['#85e5bc', '#9bbfff', '#efb47b'] as const
export const plotWidth = 440
export const signalY = (dbm: number) => 118 - (dbm + 91) * 2.1

/** Both views share the channel scale, envelope and legend color of each access point. */
export function wifiPlot(band: Band) {
  const { ticks, networks } = spectrum[band]
  const first = ticks[0]!
  const last = ticks[ticks.length - 1]!
  const x = (channel: number) => 24 + ((channel - first) / (last - first)) * 392
  return {
    ticks: ticks.map((channel) => ({ channel, x: x(channel) })),
    networks: networks.map((ap, index) => {
      const left = x(ap.channel - ap.spread)
      const center = x(ap.channel)
      const right = x(ap.channel + ap.spread)
      const top = signalY(ap.level)
      const rise = (left + center) / 2
      const fall = (center + right) / 2
      const path = [
        'M',
        left,
        118,
        'C',
        rise,
        118,
        rise,
        top,
        center,
        top,
        'S',
        fall,
        118,
        right,
        118,
      ].join(' ')
      return { ...ap, color: colors[index % colors.length], path }
    }),
  }
}
