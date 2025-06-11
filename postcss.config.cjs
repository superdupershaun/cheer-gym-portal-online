    // postcss.config.cjs
    // This file is named .cjs to explicitly tell Node.js to treat it as a CommonJS module,
    // which is robust for PostCSS plugin resolution.

    module.exports = {
      plugins: [
        require('tailwindcss'), // For Tailwind CSS v3.x, you directly require the main 'tailwindcss' package
        require('autoprefixer'), // Autoprefixer is also required
      ],
    };
    