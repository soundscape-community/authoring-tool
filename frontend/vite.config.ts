import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import browserslistToEsbuild from 'browserslist-to-esbuild'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(), 
  ],
  server: {
    proxy: {
      '^(/admin|/api|/api-auth|/map|/files|/.auth)/.*': 'http://127.0.0.1:8000'
    },
    port: 3000,
  },
  build: {
    target: browserslistToEsbuild(), 
    outDir: "../backend/frontend/serve"
  }
});
