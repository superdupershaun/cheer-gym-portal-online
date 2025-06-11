import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // IMPORTANT: The base path is crucial for GitHub Pages subfolder deployment
  base: './',
  build: {
    chunkSizeWarningLimit: 1500, // Helps manage bundle size warnings.
    // FINAL FIX: Ensure CSS is outputted as a single file with a fixed name
    cssCodeSplit: false, // Prevent CSS splitting
    rollupOptions: {
      output: {
        manualChunks: undefined, // Prevent JS code splitting
        assetFileNames: 'assets/index.css', // Force all CSS to be named 'index.css' in assets
      },
    },
  },
});
