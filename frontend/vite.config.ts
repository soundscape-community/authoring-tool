import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import svgr from 'vite-plugin-svgr';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    viteTsconfigPaths(),
    svgr({
      include: '**/*.svg?react',
    }),
  ],
  server: {
    proxy: {
      '^(/admin|/api|/api-auth|/map|/files|/.auth)/.*': 'http://127.0.0.1:8000'
    }
  }
});
