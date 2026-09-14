import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Bind to all interfaces (not just localhost) so a phone on the same
    // Wi-Fi network can reach the dev server via the machine's LAN IP.
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Split heavy, infrequently-changing vendor code into its own
        // cacheable chunks. recharts/leaflet are also lazy-loaded (see
        // LazyMapView / LazyMonthlyGenerationChart), so in practice these
        // chunks are only fetched once a map or chart actually renders.
        // (react/react-dom are deliberately left out: they're needed to
        // boot the app at all, so Rollup already keeps them in the main
        // entry chunk — forcing them into a separate chunk here just
        // produces an empty one.)
        manualChunks: {
          recharts: ['recharts'],
          leaflet: ['leaflet', 'react-leaflet'],
        },
      },
    },
  },
})
