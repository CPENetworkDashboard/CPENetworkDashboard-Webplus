import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { devStatusPlugin } from './scripts/dev-status-plugin'

export default defineConfig({
  plugins: [devStatusPlugin(), vue(), tailwindcss()],
  publicDir: 'public',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://cpe.plus',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vue: ['vue', 'vue-router'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
