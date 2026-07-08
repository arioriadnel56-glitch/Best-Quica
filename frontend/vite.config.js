import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/app/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Best-Quinca — Gestion Quincaillerie',
        short_name: 'Best-Quinca',
        theme_color: '#1e3a5f',
        background_color: '#f1f5f9',
        display: 'standalone',
        start_url: '/app/',
        icons: [
          { src: '/logo192.png', sizes: '192x192', type: 'image/png' },
          { src: '/logo512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ],
  server: {
    port: 8000,
    proxy: { '/api': { target: 'http://localhost:8081', changeOrigin: true } }
  }
});
