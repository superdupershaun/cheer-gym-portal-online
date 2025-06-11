import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // IMPORTANT: Set base to your GitHub repository name for absolute paths
  base: '/cheer-gym-portal-online/', // <--- THIS IS YOUR REPOSITORY NAME
  build: {
    chunkSizeWarningLimit: 1500, // Helps manage bundle size warnings.
    cssCodeSplit: true, // Let Vite split CSS normally now, post-processing will handle paths
    rollupOptions: {
      output: {
        manualChunks: undefined,
        // Let Vite use its default hashed asset names. The GH Actions workflow will fix the base.
        // assetFileNames: 'assets/[name]-[hash][extname]', // Vite default
      },
    },
  },
});
