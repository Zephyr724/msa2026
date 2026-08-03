/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const proxyTarget = process.env.VITE_DEV_PROXY_TARGET ?? 'http://localhost:5091';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: proxyTarget,
      },
      '/signin-google': {
        target: proxyTarget,
      },
      '/hubs': {
        target: proxyTarget.replace(/^http/, 'ws'),
        ws: true,
      },
      '/health': {
        target: proxyTarget,
      },
      '/openapi': {
        target: proxyTarget,
      },
      '/scalar': {
        target: proxyTarget,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
