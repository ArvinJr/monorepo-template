import * as path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    dts({ tsconfigPath: './tsconfig.app.json' }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    emptyOutDir: false,
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'demo-ui',
      formats: ['es', 'umd'],
      fileName: format => `demo-ui.${format}.js`,
    },
    rollupOptions: {
      external: ['vue', 'lodashEs'],
      output: {
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
})
