import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // IMPORTANT: The base path is crucial for GitHub Pages subfolder deployment
  base: './',
  build: {
    chunkSizeWarningLimit: 1500, // Helps manage bundle size warnings.
    cssCodeSplit: false, // Ensure all CSS is bundled into a single file
    rollupOptions: {
      output: {
        manualChunks: undefined, // Prevent JS code splitting if any
        // Force the main CSS file to be named 'style.css' without a hash
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') { // This targets the main CSS output from Vite
            return 'assets/style.css'; // Consistent path and filename
          }
          // For other assets (JS, images, etc.), use default hashed names
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
});
