// postcss.config.cjs
// This file is named .cjs to explicitly tell Node.js to treat it as a CommonJS module,
// which is often more robust for PostCSS plugin resolution.

module.exports = {
  plugins: [
    // IMPORTANT: Use the correct, separate PostCSS plugin for Tailwind CSS
    require('@tailwindcss/postcss'),
    require('autoprefixer'),
  ],
};
