import * as path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@demo/ui/style.css': path.resolve(__dirname, '../ui/dist/ui.css'),
      '@demo/ui': path.resolve(__dirname, '../ui/src'),
    },
  },
})
