export const chapters = [
  {
    scene: 'connect',
    platform: 'Android',
    label: '连接',
    heading: '连接与射频质量',
    copy: '切换主辅载波，查看对应小区的频段、PCI 和射频读数。',
    caption: '连接看板 · 主载波与辅载波',
  },
  {
    scene: 'links',
    platform: 'Android',
    label: '链路',
    heading: '载波聚合与上下行链路',
    copy: '查看各载波的频段、带宽和发射功率，以及上下行的调制和 MCS。',
    caption: '连接看板 · 载波聚合与链路',
  },
  {
    scene: 'neighbors',
    platform: 'Android',
    label: '邻区',
    heading: '同一频点，三个邻区',
    copy: '在 LTE B8 的 3740 频点，比较三个邻区的 PCI 和 RSRP。',
    caption: '华为 H153-381 · 设备信息与邻区',
  },
  {
    scene: 'lock',
    platform: 'Android',
    label: '锁频',
    heading: '分别配置主辅小区',
    copy: '在 LTE 和 NR 频段里，分别选择主小区和辅小区可以使用的频段。',
    caption: '锁频段 · Pcell+Scell / Scell',
  },
  {
    scene: 'tests',
    platform: 'Android',
    label: '测试',
    heading: '从测试页进入网络诊断',
    copy: 'Ping、测速、路由测试、会话数和 Wi-Fi 信道都能从这里打开。',
    caption: '测试 · 网络诊断',
  },
  {
    scene: 'speed',
    platform: 'Android',
    label: '测速',
    heading: '双向测速',
    copy: '下载和上传各有一条 30 秒曲线，可对照平均速率、平滑峰值和流量。',
    caption: '测速 · 下载与上传',
  },
  {
    scene: 'wifi',
    platform: 'Android',
    label: 'Wi-Fi',
    heading: '附近的 Wi-Fi 信道',
    copy: '查看 2.4 GHz 和 5 GHz 热点分布，比较各信道的占用情况。',
    caption: 'Wi-Fi 信道 · 频道健康',
  },
  {
    scene: 'settings',
    platform: 'Android',
    label: '外观',
    heading: '界面风格',
    copy: '颜色模式、页面壁纸、底部导航栏样式和卡片外观均可以单独调整。',
    caption: '设置 · 界面风格',
  },
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
] as const
export type SceneId = (typeof chapters)[number]['scene']

/** Older shared product URLs still open the corresponding shot. */
export function linkedScene(view: unknown): SceneId | undefined {
  return chapters.find((chapter) => chapter.scene === view)?.scene
}
