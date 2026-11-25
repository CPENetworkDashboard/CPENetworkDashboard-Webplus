// The H153-381 example follows the fields and order of the Huawei connection screen.
export const deviceStats = [
  ['设备型号', 'H153-381'],
  ['WLAN接入', '1'],
  ['当日流量', '54.22 MB'],
  ['软件版本', 'H6623SP2C233'],
  ['上次清空日期', '2026-11-16'],
  ['下载速率', '0.00 Mbps'],
  ['上传速率', '0.00 Mbps'],
  ['本次下载', '18.88 MB'],
  ['本次上传', '34.34 MB'],
  ['本月下载', '9.41 GB'],
  ['本月上传', '931.59 MB'],
  ['累计连接', '4天 1时 31分'],
  ['本次连接', '0天 0时 1分'],
] as const

export const radioNeighbors = [
  { band: 'B8', arfcn: '3740', pci: '42', rsrp: '-104', rsrq: '-12' },
  { band: 'B8', arfcn: '3740', pci: '265', rsrp: '-109', rsrq: '-18' },
  { band: 'B8', arfcn: '3740', pci: '73', rsrp: '-109', rsrq: '-18' },
] as const
