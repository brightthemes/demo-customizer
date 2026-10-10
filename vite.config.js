import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    lib: {
      entry: 'src/index.js',
      name: 'BtCustomize',
      formats: ['iife'],
      fileName: () => 'customize.js',
    },
    cssCodeSplit: false,
    emptyOutDir: true,
  },
})
