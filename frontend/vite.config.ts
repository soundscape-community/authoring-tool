// Copyright (c) Soundscape Community Contributors.
/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import browserslistToEsbuild from 'browserslist-to-esbuild'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(), 
  ],
  test: {
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    globals: true,
  },
  server: {
    proxy: {
      '^(/admin|/api|/api-auth|/dj-rest-auth|/files|/.auth)/.*': {
        target: 'http://localhost:8000',
        xfwd: true,
        changeOrigin: true
      }
    },
    host: '127.0.0.1',
    port: 3000,
  },
  build: {
    target: browserslistToEsbuild(), 
    outDir: "../backend/frontend/serve"
  }
});
