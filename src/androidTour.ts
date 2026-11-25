export type AndroidView = 'connect' | 'neighbors' | 'lock' | 'speed' | 'wifi' | 'tests' | 'settings'
export type CellTarget = { band: string; arfcn: string; pci: string }
export const androidFeatures = [
  {
    id: 'connect',
    label: '连接看板',
    icon: 'signal',
    title: '查看当前连接的小区',
    copy: '移动 CPE 或调整天线时，对照当前小区、射频质量和上下行链路。切换载波可以查看主小区和辅小区各自的指标。',
  },
  {
    id: 'neighbors',
    label: '设备与邻区',
    icon: 'phone',
    title: '比较附近小区的信号',
    copy: '这台 H153-381 报告了三个 B8 邻区。点选邻区，核对频点和 PCI，再确认锁小区。',
  },
  {
    id: 'lock',
    label: '频段锁定',
    icon: 'sliders',
    title: '选择主小区和辅小区的频段',
    copy: '选择频段角色，勾选 LTE 或 NR 频段后应用。在同一页也可以按频点或小区设置锁定。',
  },
  {
    id: 'speed',
    label: '双向测速',
    icon: 'activity',
    title: '对照上下行的速率曲线',
    copy: '回放一次双向测试。下载和上传各自记录最近 30 秒的速率、平均值、平滑峰值和流量。',
  },
  {
    id: 'wifi',
    label: 'Wi-Fi 信道',
    icon: 'wifi',
    title: '看清附近热点占用的信道',
    copy: '选择 2.4、5 或 6 GHz，观察曲线重叠的位置，对照热点的信道和信号强度。',
  },
] as const
const otherViews = [
  {
    id: 'tests',
    label: '测试',
    icon: 'activity',
    title: '选择网络测试工具',
    copy: '打开测速查看上下行表现，或进入 Wi-Fi 信道观察周围热点。',
  },
  {
    id: 'settings',
    label: '设置',
    icon: 'settings',
    title: '调整看板的显示方式',
    copy: '选择深浅色和信号质量样式，再回到连接页对照开启后的效果。',
  },
] as const
export function androidFeature(id: unknown) {
  return (
    [...androidFeatures, ...otherViews].find((feature) => feature.id === id) ?? androidFeatures[0]
  )
}
