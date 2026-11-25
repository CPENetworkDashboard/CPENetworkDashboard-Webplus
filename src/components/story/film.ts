export const chapters = [
  {
    scene: 'desktop-connect',
    platform: 'macOS / Windows',
    label: '看板',
    heading: '桌面连接看板',
    copy: '从当前小区看起。频段、PCI 和上下行链路都在同一扇窗口里，射频质量单独呈现。',
    caption: '桌面连接看板 · 射频质量',
  },
  {
    scene: 'desktop-lock',
    platform: 'macOS / Windows',
    label: '回读',
    heading: '从频段选择到设备回读',
    copy: '选择 LTE B8，写入后读取设备返回的频段。目标和回读并列显示，方便核对这次调整。',
    caption: '桌面频段管理 · B8 回读',
  },
  {
    scene: 'desktop-test',
    platform: 'macOS / Windows',
    label: '时延',
    heading: '一次 Ping 的记录',
    copy: '逐次绘出往返时延，在测试结束时比较平均值和峰值。',
    caption: '桌面链路测试 · Ping 记录',
  },
  {
    scene: 'connect',
    platform: 'Android',
    label: '连接',
    heading: '连接与射频质量',
    copy: '同一台 CPE 上，主载波和辅载波各有一组读数。连接看板并列展示频段、PCI、RSRP 和 SINR。',
    caption: '连接看板 · 主载波与辅载波',
  },
  {
    scene: 'neighbors',
    platform: 'Android',
    label: '邻区',
    heading: '同一频点，三个邻区',
    copy: 'H153-381 在 LTE B8 上报告了三个邻区。它们的频点都是 3740，PCI 和接收功率各不相同。',
    caption: '华为 H153-381 · 邻区显示',
  },
  {
    scene: 'lock',
    platform: 'Android',
    label: '锁频',
    heading: '分别配置主辅小区',
    copy: '先指定频段角色，再选择 LTE 或 NR 频段。B8 用于主小区或辅小区，Scell 角色可以单独配置。',
    caption: '锁频段 · Pcell+Scell / Scell',
  },
  {
    scene: 'speed',
    platform: 'Android',
    label: '测速',
    heading: '双向测速',
    copy: '上下行各有一条最近 30 秒的速率曲线。平均值、平滑峰值和流量记录了整次测试的表现。',
    caption: '测速 · 下载与上传',
  },
  {
    scene: 'wifi',
    platform: 'Android',
    label: 'Wi-Fi',
    heading: '附近的 Wi-Fi 信道',
    copy: '在 2.4 GHz 和 5 GHz 两个频段上观察附近热点。曲线重叠的地方，是多个热点共用的频谱。',
    caption: 'Wi-Fi 信道 · 周边热点',
  },
] as const
export type SceneId = (typeof chapters)[number]['scene']

/** Older shared product URLs still open the corresponding shot. */
export function linkedScene(view: unknown): SceneId | undefined {
  if (view === 'tests') return 'speed'
  if (view === 'settings') return 'connect'
  return chapters.find((chapter) => chapter.scene === view)?.scene
}
