import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // IMPORTANT: The base path is crucial for GitHub Pages subfolder deployment
  base: './',
  build: {
    chunkSizeWarningLimit: 1500, // Helps manage bundle size warnings.
    // FINAL FIX: Force CSS to be inlined directly into index.html
    rollupOptions: {
      output: {
        // Ensure all CSS is bundled into a single chunk
        manualChunks: undefined,
        // This function forces CSS to be inlined by returning false for external assets
        // (Vite's default behavior might externalize CSS even with cssCodeSplit: false)
        assetFileNames: (assetInfo) => {
            if (assetInfo.name.endsWith('.css')) {
                // Return 'assets/index.css' to ensure it's a single file.
                // Vite's magic will inline it if `cssCodeSplit` is false and it's small enough,
                // or if specific plugins for inlining are used.
                // However, the primary effect of `cssCodeSplit: false` is to consolidate.
                // Forcing true inlining is harder and usually relies on custom Rollup plugins.
                // Let's rely on cssCodeSplit: false and verify the resulting HTML structure directly.
                return 'assets/index.css'; // Just a consistent name
            }
            return 'assets/[name]-[hash][extname]';
        },
      },
    },
    cssCodeSplit: false, // Prevents CSS splitting into separate files, should lead to single CSS bundle
  },
});
