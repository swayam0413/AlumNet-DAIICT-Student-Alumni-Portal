import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    allowedHosts: true as any,
    proxy: {
      '/api': {
        target: 'pythonbackend-geminiapikey.up.railway.app',
        changeOrigin: true,
      },
    },
  },
});
