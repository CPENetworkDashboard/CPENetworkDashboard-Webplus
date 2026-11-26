<script setup lang="ts">
type Glyph = 'connect' | 'lock' | 'test' | 'settings' | 'back' | 'signal' | 'wifi' | 'battery'

defineProps<{ name: Glyph; selected?: boolean }>()
</script>

<template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="selected ? 1.95 : 1.65"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path
      v-if="name === 'connect'"
      d="M4.5 10.25 10.7 4.7a1.95 1.95 0 0 1 2.6 0l6.2 5.55v8.1a1.65 1.65 0 0 1-1.65 1.65H14.4v-4.35a2.4 2.4 0 1 0-4.8 0V20H6.15a1.65 1.65 0 0 1-1.65-1.65z"
      :fill="selected ? 'currentColor' : 'none'"
    />
    <g v-else-if="name === 'lock'">
      <path d="M8 10.6V8a4 4 0 0 1 7.65-1.62" />
      <rect x="5.2" y="10.6" width="13.6" height="9.7" rx="2.35" />
    </g>
    <g v-else-if="name === 'test'">
      <path d="M10.25 3.25h3.5M17.7 7.1l1.12-1.17" />
      <circle cx="12" cy="13.65" r="7.05" />
      <path d="M12 13.65v-3.45" />
    </g>
    <g v-else-if="name === 'settings'">
      <path
        d="m12.9 3.85 6.1 3.52c.56.32.9.92.9 1.56v6.14c0 .64-.34 1.24-.9 1.56l-6.1 3.52a1.8 1.8 0 0 1-1.8 0L5 16.63c-.56-.32-.9-.92-.9-1.56V8.93c0-.64.34-1.24.9-1.56l6.1-3.52a1.8 1.8 0 0 1 1.8 0Z"
      />
      <circle cx="12" cy="12" r="2.65" />
    </g>
    <path v-else-if="name === 'back'" d="M19.5 12H5m6-6-6 6 6 6" />
    <g v-else-if="name === 'signal'" fill="currentColor" stroke="none">
      <rect x="2.5" y="15.5" width="3.25" height="4.5" rx="0.9" />
      <rect x="7.6" y="12" width="3.25" height="8" rx="0.9" />
      <rect x="12.7" y="8.25" width="3.25" height="11.75" rx="0.9" />
      <rect x="17.8" y="4" width="3.25" height="16" rx="0.9" />
    </g>
    <g v-else-if="name === 'wifi'" stroke-width="2.05">
      <path
        d="M2.8 9.1a14.5 14.5 0 0 1 18.4 0m-15.15 3.3a9.45 9.45 0 0 1 11.9 0m-8.65 3.35a4.5 4.5 0 0 1 5.4 0"
      />
      <circle cx="12" cy="19" r="1.2" fill="currentColor" stroke="none" />
    </g>
    <g v-else stroke-width="1.4">
      <rect x="2" y="6.5" width="17.9" height="11" rx="2.7" />
      <path d="M22 10.4v3.2" />
      <rect
        x="4.2"
        y="8.7"
        width="11.45"
        height="6.6"
        rx="1.05"
        fill="currentColor"
        stroke="none"
      />
    </g>
  </svg>
</template>
