import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icons/*.png', 'dict/*.dawg'],
      manifest: {
        name: 'Word Board',
        short_name: 'WordBoard',
        description: 'Offline-capable word placement game for 1–4 players',
        start_url: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#1b4332',
        theme_color: '#2d6a4f',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}', 'dict/*.dawg'],
        runtimeCaching: [],
      },
    }),
  ],
  resolve: {
    alias: { '@': '/src' },
  },
});
