<script setup lang="ts">
defineProps<{ name: string; size?: number }>()

const paths: Record<string, string> = {
  back: 'M20 12H4m7-7-7 7 7 7',
  wallpaper: 'M4 4h16v16H4zM4 16l5-5 4 4 3-3 4 4M15 8h.01',
  home: 'M3 11 12 3l9 8v9h-6v-6H9v6H3z',
  lock: 'M7 10V7a5 5 0 0 1 10 0M5 10h14v10H5z',
  timer: 'M10 2h4m-2 5v5m8 1a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
  settings: 'm12 2 9 5v10l-9 5-9-5V7Zm3 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  wifi: 'M2 8a16 16 0 0 1 20 0M5.5 12a10 10 0 0 1 13 0M9 16a5 5 0 0 1 6 0M12 20h.01',
  signal: 'M4 20v-3m5 3v-7m6 7V9m5 11V4',
  sliders: 'M4 7h7m4 0h5M4 17h3m4 0h9M11 4v6M7 14v6',
  activity: 'M3 12h4l3-8 4 16 3-8h4',
  monitor: 'M9 21h6m-3-4v4M4 3h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z',
  phone: 'M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm2 17h4',
  download: 'M12 3v12m-4-4 4 4 4-4M4 16v4h16v-4',
  check: 'm5 12 4 4L19 6',
  refresh: 'M20 4v5h-5M4 20v-5h5M5 8a8 8 0 0 1 13-3l2 4M4 15l2 4A8 8 0 0 0 19 16',
  close: 'm6 6 12 12M6 18 18 6',
  menu: 'M4 6h16M4 12h16M4 18h16',
  zoom: 'M4 9V4h5m6 0h5v5M4 15v5h5m6 0h5v-5',
  globe: 'M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18ZM21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  code: 'm8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18',
  clock: 'M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  info: 'M12 11v6m0-10v.01m9 5a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  search: 'm16 16 5 5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
  chevron: 'm8 10 4 4 4-4',
  github:
    'M9 19c-4 1-4-2-6-2m12 5v-4c0-1-.3-2-1-2 3-.3 6-1.5 6-6a4 4 0 0 0-1-3c.3-1 .3-2 0-3-1 0-2 .5-3 1a11 11 0 0 0-8 0c-1-.5-2-1-3-1-.3 1-.3 2 0 3a4 4 0 0 0-1 3c0 4.5 3 5.7 6 6-.7 0-1 1-1 2v4',
  android:
    'M6 9h12v9H6V9Zm1-4-2-3m12 3 2-3M4 10v6m16-6v6M9 18v4m6-4v4M6 9a6 6 0 0 1 12 0M9 6v.1M15 6v.1',
  windows: 'M3 5l8-1v8H3V5Zm10-1 8-1v9h-8V4ZM3 14h8v7l-8-1v-6Zm10 0h8v9l-8-1v-8Z',
  apple:
    'M16 3c-1 0-3 2-3 4 2 0 3-2 3-4ZM19 13c0-2 1-3 2-4-1-2-3-2-4-2-2 0-3 1-4 1s-2-1-4-1c-3 0-5 3-5 6 0 4 3 9 5 9 1 0 2-1 4-1s2 1 4 1c2 0 4-4 5-6-2-1-3-2-3-3Z',
}
</script>

<template>
  <svg
    :width="size || 20"
    :height="size || 20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path :d="paths[name] || paths.signal" />
  </svg>
</template>
