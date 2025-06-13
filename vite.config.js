import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/cheer-gym-portal-online/',
  build: {
    outDir: 'dist',
  },
});