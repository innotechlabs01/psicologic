/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{astro,html,js,jsx,ts,tsx}', // Ensure Astro files are included
  ],
  darkMode: 'class', // Enable dark mode using the `class` strategy
  theme: {
    extend: {},
  },
  plugins: [],
};