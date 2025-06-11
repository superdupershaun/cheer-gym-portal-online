// postcss.config.js
// This configuration uses CommonJS syntax (module.exports and require)
// which is often more robust for PostCSS plugin resolution in various build environments.

module.exports = {
  plugins: [
    require('tailwindcss'), // Ensure tailwindcss package is installed
    require('autoprefixer'), // Ensure autoprefixer package is installed
    // If you specifically need the @tailwindcss/postcss plugin and it's installed,
    // you would use: require('@tailwindcss/postcss')
    // However, typically just requiring 'tailwindcss' works for its PostCSS integration.
  ],
};
