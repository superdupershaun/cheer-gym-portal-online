import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // IMPORTANT: The base path is crucial for GitHub Pages subfolder deployment
  base: './',
  build: {
    chunkSizeWarningLimit: 1500, // Helps manage bundle size warnings.
    // IMPORTANT: Inline CSS into HTML to bypass external CSS loading issues
    cssCodeSplit: false, // Prevents CSS splitting into separate files
    rollupOptions: {
      output: {
        manualChunks: undefined, // Prevents code splitting for JS, which can sometimes impact CSS chunking
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') {
            return 'assets/index.css'; // Ensure consistent naming if CSS is not inlined
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
});
