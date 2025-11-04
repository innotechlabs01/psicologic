/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{astro,html,js,jsx,ts,tsx}', // ¡Esta línea es CRÍTICA!
    './src/components/**/*.{js,jsx,ts,tsx}', // Asegúrate de que los componentes React también estén escaneados
  ],
  darkMode: 'class', // Enable dark mode using the `class` strategy
  theme: {
    extend: {},
  },
  plugins: [],
};