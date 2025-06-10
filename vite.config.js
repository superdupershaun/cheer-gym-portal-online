import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/cheer-gym-portal-online/', // IMPORTANT: Replace 'your-repository-name' with your actual GitHub repository name
  build: {
    chunkSizeWarningLimit: 1500, // Increased limit to suppress the warning for larger chunks
  },
});