/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // CRUCIAL: This line tells Tailwind to scan your React files
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}