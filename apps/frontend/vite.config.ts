import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// To enable PWA, install vite-plugin-pwa and uncomment:
// import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    // VitePWA({
    //   registerType: 'autoUpdate',
    //   manifest: {
    //     name: 'FlowMind',
    //     short_name: 'FlowMind',
    //     theme_color: '#6c63ff',
    //     background_color: '#0a0b0f',
    //     display: 'standalone',
    //     icons: [
    //       { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    //       { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    //     ],
    //   },
    // }),
  ],
  resolve: {
    alias: {
      '@flowmind/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
})
