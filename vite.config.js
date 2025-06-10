    import { defineConfig } from 'vite';
    import react from '@vitejs/plugin-react';

    export default defineConfig({
      plugins: [react()],
      // Use a relative path for the base URL in production builds.
      // This ensures assets are loaded correctly when deployed to GitHub Pages
      // from a subpath (e.g., https://<username>.github.io/<repository-name>/).
      base: './', // <-- IMPORTANT: Ensure this line is exactly './'
      build: {
        chunkSizeWarningLimit: 1500, // This helps manage bundle size warnings.
      },
    });
    