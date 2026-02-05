import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg', 'turtle_art_logo.jpeg'],
      manifest: {
        name: 'Turtle Art',
        short_name: 'Turtle Art',
        description: 'متجر Turtle Art للحقائب المميزة',
        theme_color: '#1A3F2F',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: '/android-icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/favicon/apple-icon-180x180.png',
            sizes: '180x180',
            type: 'image/png'
          },
          {
            src: '/favicon/ms-icon-144x144.png',
            sizes: '144x144',
            type: 'image/png'
          },
          {
            src: '/turtle_art_logo.jpeg',
            sizes: '512x512',
            type: 'image/jpeg',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
