import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // IMPORTANT: The base path is crucial for GitHub Pages subfolder deployment
  base: './', 
  build: {
    chunkSizeWarningLimit: 1500, // Helps manage bundle size warnings.
  },
  // IMPORTANT: No 'css' block for postcss here. Vite will auto-detect postcss.config.cjs.
});
