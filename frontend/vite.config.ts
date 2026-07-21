import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // MA-004 / FR-058: the scanner must keep working at the classroom door
    // when connectivity drops. The service worker caches the app shell so the
    // assistant can launch and scan offline; scans queue in IndexedDB.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'TIMS — Teaching Institute Management System',
        short_name: 'TIMS',
        description: 'Attendance, fees and student management for teaching institutes.',
        theme_color: '#0a0a0a',
        background_color: '#f4f4f5',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/scanner',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Never serve the cached shell for API routes — attendance and payment
        // state must be authoritative from the server (FR-080 flags unpaid
        // students live at the door).
        navigateFallbackDenylist: [/^\/api/],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY ?? 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
