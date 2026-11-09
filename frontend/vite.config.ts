import path from 'node:path'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',

    port: 5173,

    proxy: {
      '/api': {
        target: 'http://ai-assistant-backend:3000',
        changeOrigin: true,

        // Remove /api before forwarding
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
